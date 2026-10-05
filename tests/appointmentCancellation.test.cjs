const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function harness(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const module = { exports: {} };
  const calls = [];
  let resolve, reject;
  const response = new Promise((yes, no) => { resolve = yes; reject = no; });
  const apt = { id: 'appointment', status: 'confirmed', patientId: 'patient', doctorId: 'doctor' };
  const slots = [];
  let index = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState: (initial) => {
      const position = index++;
      if (!(position in slots)) slots[position] = initial;
      return [slots[position], (value) => { slots[position] = value; }];
    },
    useRef: (initial) => {
      const position = index++;
      if (!(position in slots)) slots[position] = { current: initial };
      return slots[position];
    },
  };
  const builder = new Proxy({}, { get: (_target, name) => name === 'System' ? 'system' : () => builder });
  const store = (select) => {
    const value = { appointments: [apt], cancelAppointment: () => calls.push('local-cancel') };
    return select ? select(value) : value;
  };
  const imports = {
    react,
    'react-native': { StyleSheet: { create: (value) => value }, Platform: { OS: 'web' },
      Alert: { alert: () => calls.push('alert') }, Share: {}, Linking: {} },
    'expo-router': { useLocalSearchParams: () => ({ id: apt.id, appointmentId: apt.id }),
      useRouter: () => ({ replace: () => calls.push('navigate'), canGoBack: () => false }) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'react-native-reanimated': { default: { View: 'AnimatedView' }, __esModule: true,
      FadeIn: builder, FadeInDown: builder, FadeInUp: builder, ReduceMotion: { System: 'system' } },
    '@tanstack/react-query': { useQueryClient: () => ({
      setQueryData: (_key, value) => { calls.push(['cache', value.status]); },
      invalidateQueries: async () => { calls.push('invalidate'); },
    }) },
    'expo-haptics': {},
    '@/hooks/queries/useAppointmentsQuery': { useAppointmentDetailQuery: () => ({ data: apt, refetch: async () => {} }) },
    '@/store/useAppointmentStore': { useAppointmentStore: store },
    '@/store/useNotificationStore': { useNotificationStore: { getState: () => ({ addNotification: () => calls.push('notify') }) } },
    '@/services/appointmentService': { appointmentService: { cancelAppointment: () => { calls.push('server-cancel'); return response; } } },
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {}, isDark: false }) },
    '@/constants/theme': { StitchColors: {}, Palette: {}, Typography: {}, BorderRadius: {}, Shadows: {}, Spacing: {} },
    '@/utils/platformStyles': { platformShadow: () => ({}) },
    '@/utils/formatters': { formatHumanDate: () => '', formatTimeSlot: () => '', formatCurrency: () => '' },
  };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports, console,
    require: (name) => {
      if (name in imports) return imports[name];
      if (name.startsWith('@/components/')) return new Proxy({}, { get: (_target, key) => String(key) });
      if (name === 'lucide-react-native') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const find = (tree) => {
    if (!tree || typeof tree !== 'object') return;
    if (tree.type === 'ConfirmationDialog') return tree;
    for (const child of tree.children || []) { const match = find(child); if (match) return match; }
  };
  return { calls, resolve, reject, render: () => { index = 0; return find(module.exports.default()); } };
}

for (const file of ['src/app/(patient)/appointments/[id].tsx', 'src/app/(patient)/booking/success.tsx']) {
  test(`${file}: failed cancellation leaves record intact and does not navigate`, async () => {
    const app = harness(file);
    const pending = app.render().props.onConfirm();
    assert.deepEqual(app.calls, ['server-cancel']);
    assert.equal(app.render().props.loading, true);
    app.reject(new Error('network unavailable'));
    await pending;
    assert.deepEqual(app.calls, ['server-cancel', 'alert']);
    assert.equal(app.render().props.loading, false);
  });

  test(`${file}: rapid duplicate confirm sends once, updates only after server success`, async () => {
    const app = harness(file);
    const confirm = app.render().props.onConfirm;
    const pending = confirm();
    await confirm();
    assert.deepEqual(app.calls, ['server-cancel']);
    app.resolve();
    await pending;
    assert.equal(app.calls.filter((value) => value === 'server-cancel').length, 1);
    assert.equal(app.calls.filter((value) => value === 'local-cancel').length, 1);
    assert.deepEqual(app.calls.find(Array.isArray), ['cache', 'cancelled']);
    assert.ok(app.calls.includes('navigate'));
    assert.equal(app.render().props.loading, false);
  });
}
