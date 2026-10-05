const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function render({ user, server, stored = [] }) {
  const calls = [];
  const module = { exports: {} };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState: (value) => [value, () => {}],
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
  };
  const imports = {
    react,
    'react-native': { StyleSheet: { create: (value) => value }, RefreshControl: 'RefreshControl', ScrollView: 'ScrollView' },
    'expo-router': { useRouter: () => ({}) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'react-native-reanimated': { default: {}, __esModule: true },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => calls.push(queryKey[0]) }) },
    '@/store/useAuthStore': { useAuthStore: () => ({ user }) },
    '@/store/useHealthStore': { useHealthStore: () => ({ records: [], prescriptions: stored }) },
    '@/hooks/queries/usePrescriptionsQuery': { usePrescriptionsQuery: () => ({ data: server, refetch: async () => calls.push('refetch') }) },
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
    '@/constants/theme': { StitchColors: {}, BorderRadius: {}, Shadows: {}, Spacing: {}, Palette: {} },
  };
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/app/(patient)/(tabs)/health.tsx'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports,
    require: (name) => {
      if (name in imports) return imports[name];
      if (name.startsWith('@/components/')) return new Proxy({}, { get: (_target, key) => String(key) });
      if (name === 'lucide-react-native') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const tree = module.exports.default();
  const find = (tree, type) => {
    if (!tree || typeof tree !== 'object') return;
    if (tree.type === type) return tree;
    for (const child of tree.children || []) { const match = find(child, type); if (match) return match; }
  };
  return { calls, list: find(tree, 'PrescriptionsTab').props.prescriptions,
    refresh: find(tree, 'ScrollView').props.refreshControl.props.onRefresh };
}

test('health hub never matches a cached prescription by patient name or missing ID', () => {
  const app = render({ user: { id: 'account', name: 'Same Name' }, stored: [
    { id: 'ours', patientId: 'account' },
    { id: 'someone-else', patientId: 'other', patientName: 'Same Name' },
    { id: 'unknown', patientName: 'Same Name' },
  ] });
  assert.deepEqual(Array.from(app.list, (rx) => rx.id), ['ours']);
  assert.equal(render({ stored: [{ id: 'private' }] }).list.length, 0);
});

test('authorized server list, including empty, replaces cached prescriptions', () => {
  const stored = [{ id: 'cached', patientId: 'account' }];
  assert.equal(render({ user: { id: 'account' }, server: [], stored }).list.length, 0);
  const server = [{ id: 'canonical', patientId: 'canonical-patient-id' }];
  assert.equal(render({ user: { id: 'account' }, server, stored }).list, server);
});

test('health refresh makes one prescription refetch without parallel invalidation', async () => {
  const app = render({ user: { id: 'account' } });
  await app.refresh();
  assert.deepEqual(app.calls, ['health-records', 'appointments', 'refetch']);
});
