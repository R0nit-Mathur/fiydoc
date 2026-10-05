const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual TypeScript without installing a test runner or making requests.
function loadTS(relativePath, imports = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, AbortController, URL, console,
    require: (name) => {
      if (name in imports) return imports[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename: relativePath });
  return module.exports;
}

const { mapPrescription } = loadTS('src/utils/prescriptionMapper.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));

test('missing fields do not create advice, identity, dates, signatures or duration', () => {
  const rx = mapPrescription({ id: 'rx-1', medicines: [{}], doctorNotes: 'Diagnosis: possible illness.' });
  for (const key of ['doctorName', 'doctorSpecialty', 'clinicName', 'clinicAddress', 'patientName', 'patientAge',
    'patientGender', 'diagnosis', 'followUpInstructions', 'signedAt', 'vitals', 'tests', 'lifestyleInstructions']) {
    assert.equal(rx[key], undefined, key);
  }
  assert.equal(rx.createdAt, '');
  assert.equal(rx.verificationCode, '');
  assert.equal(rx.medicines[0].durationDays, undefined);
  assert.equal(rx.medicines[0].dosage, '');
  assert.equal(rx.medicines[0].frequency, '');
  assert.equal(rx.medicines[0].instructions, undefined);
});

test('recorded fields including newborn age and explicit fasting false survive', () => {
  const rx = mapPrescription({
    id: 'rx-2', patient: { fullName: 'Recorded Patient', age: 0, gender: 'Recorded gender' },
    doctor: { fullName: 'Recorded Doctor', qualifications: ['MBBS'], clinic: { name: 'Clinic', address: 'Address' } },
    diagnosis: 'Recorded diagnosis', doctorNotes: 'Recorded advice', followUpInstructions: 'Recorded review',
    medicines: [{ name: 'Recorded medicine', dosage: 'Recorded dose', frequency: 'Recorded frequency', durationDays: 3,
      instructions: 'Recorded timing' }],
    labTests: [{ name: 'Recorded test', fastingRequired: false }, 'Another test'],
    consultation: { symptoms: ['Recorded symptom'], vitals: { pulse: 60 } },
    verificationCode: 'server-code', createdAt: '2026-10-05T12:00:00Z',
    issuedAt: '2026-10-05T12:00:00Z', signedAt: '2026-10-05T12:00:00Z',
  });
  assert.equal(rx.patientAge, 0);
  assert.equal(rx.doctorName, 'Recorded Doctor');
  assert.equal(rx.clinicAddress, 'Address');
  assert.equal(rx.medicines[0].durationDays, 3);
  assert.equal(rx.followUpInstructions, 'Recorded review');
  assert.equal(rx.tests[0].fastingRequired, false);
  assert.equal(rx.tests[1].fastingRequired, undefined);
  assert.deepEqual(plain(rx.symptoms), ['Recorded symptom']);
  assert.deepEqual(plain(rx.vitals), { pulse: '60' });
  assert.equal(rx.verificationCode, 'server-code');
  assert.ok(rx.createdAt.includes('2026'));
  assert.equal(rx.signedAt, undefined, 'backend timestamps alone cannot prove a signature');
});

test('invalid dates, durations and malformed optional collections remain unknown', () => {
  for (const createdAt of [undefined, null, '', 'bad date', '2026-02-30', '2026-10-05Tbad', 0]) {
    assert.equal(mapPrescription({ id: 'rx', createdAt }).createdAt, '');
  }
  for (const durationDays of [undefined, null, '', '5', 0, -1, NaN, Infinity]) {
    const rx = mapPrescription({ id: 'rx', medicines: [{ durationDays }] });
    assert.equal(rx.medicines[0].durationDays, undefined);
  }
  const rx = mapPrescription({ id: 'rx', medicines: {}, symptoms: 'not an array', lifestyleInstructions: {}, vitals: [] });
  assert.deepEqual(plain(rx.medicines), []);
  assert.equal(rx.symptoms, undefined);
  assert.equal(rx.lifestyleInstructions, undefined);
  assert.equal(rx.vitals, undefined);
  assert.throws(() => mapPrescription(null), /Invalid prescription/);
});

test('unknown fasting is not coerced into a preparation instruction', () => {
  const rx = mapPrescription({ id: 'rx', tests: [null, {}, { name: 'Test', fastingRequired: 'false' }] });
  assert.ok(rx.tests.every((item) => item.fastingRequired === undefined));
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('list query cancels stale writes, scopes cache to account, and rejects malformed success', async () => {
  let user = { id: 'account-a', role: 'patient', accessToken: 'a' };
  let config;
  let nextRequest;
  const writes = [];
  const auth = () => ({ user });
  auth.getState = () => ({ user });
  const health = (select) => select({ setPrescriptions: (value) => writes.push(value) });
  const { usePrescriptionsQuery } = loadTS('src/hooks/queries/usePrescriptionsQuery.ts', {
    '@tanstack/react-query': { useQuery: (value) => { config = value; return value; } },
    '@/services/apiClient': { apiClient: (_url, { signal }) => { assert.ok(signal); return nextRequest.promise; } },
    '@/store/useHealthStore': { useHealthStore: health },
    '@/store/useAuthStore': { useAuthStore: auth },
    '@/utils/prescriptionMapper': { mapPrescription },
  });
  usePrescriptionsQuery('target');
  assert.deepEqual(plain(config.queryKey), ['prescriptions', 'account-a', 'patient', 'target']);
  nextRequest = deferred();
  const first = config.queryFn({ signal: new AbortController().signal });
  user = { id: 'account-b', role: 'patient', accessToken: 'b' };
  nextRequest.resolve([{ id: 'old-record' }]);
  await assert.rejects(first, /cancelled/);
  assert.equal(writes.length, 0);

  usePrescriptionsQuery('target');
  nextRequest = deferred();
  const controller = new AbortController();
  const second = config.queryFn({ signal: controller.signal });
  controller.abort();
  nextRequest.resolve([{ id: 'old-target' }]);
  await assert.rejects(second, /cancelled/);
  assert.equal(writes.length, 0);

  nextRequest = deferred();
  const malformed = config.queryFn({ signal: new AbortController().signal });
  nextRequest.resolve({ records: [] });
  await assert.rejects(malformed, /Invalid prescription list/);
  assert.equal(writes.length, 0);

  nextRequest = deferred();
  const success = config.queryFn({ signal: new AbortController().signal });
  nextRequest.resolve([{ id: 'rx', medicines: [{}] }]);
  const mapped = await success;
  assert.deepEqual(plain(mapped), plain([mapPrescription({ id: 'rx', medicines: [{}] })]));
  assert.equal(writes.length, 1);
});

// Minimal hook lifecycle harness: deferred requests deliberately ignore abort so
// stale-result guards are tested even when cancellation is not honored upstream.
function detailHarness() {
  let id = 'route-a';
  let user = { id: 'account-a', role: 'patient', accessToken: 'a' };
  let index = 0;
  const slots = [];
  const effects = [];
  const requests = [];
  const writes = [];
  const unchanged = (a, b) => a && b && a.length === b.length && a.every((value, i) => value === b[i]);
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
    useCallback: (callback, deps) => {
      const position = index++;
      if (!unchanged(slots[position]?.deps, deps)) slots[position] = { callback, deps };
      return slots[position].callback;
    },
    useLayoutEffect: (effect, deps) => {
      const position = index++;
      if (!unchanged(slots[position]?.deps, deps)) {
        slots[position]?.cleanup?.();
        slots[position] = { deps };
        effects.push(() => { slots[position].cleanup = effect(); });
      }
    },
  };
  const auth = () => ({ user });
  auth.getState = () => ({ user });
  const health = () => ({ prescriptions: [] });
  health.getState = () => ({ prescriptions: [], addPrescription: (rx) => writes.push(rx) });
  const { default: Screen } = loadTS('src/app/(patient)/health/prescription/[id].tsx', {
    react,
    'react-native': { View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity',
      RefreshControl: 'RefreshControl', StyleSheet: { create: (value) => value }, Share: {}, Alert: {}, Linking: {} },
    'expo-router': { useLocalSearchParams: () => ({ id }), useRouter: () => ({}) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/store/useHealthStore': { useHealthStore: health },
    '@/store/useAuthStore': { useAuthStore: auth },
    '@/services/apiClient': { apiClient: (url, { signal }) => {
      const request = { ...deferred(), url, signal }; requests.push(request); return request.promise;
    } },
    '@/utils/prescriptionMapper': { mapPrescription },
    '@/components/ui/Skeleton': { CardSkeleton: 'Skeleton', TextBlockSkeleton: 'TextSkeleton' },
    '@/components/ui/Avatar': { Avatar: 'Avatar' },
    '@/constants/theme': { BorderRadius: {}, Shadows: {}, Spacing: {}, StitchColors: {}, Palette: {} },
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {}, isDark: false }) },
    'lucide-react-native': new Proxy({}, { get: (_target, name) => String(name) }),
  });
  return {
    requests, writes, slots,
    render: () => { index = 0; const tree = Screen(); while (effects.length) effects.shift()(); return tree; },
    route: (value) => { id = value; },
    account: (value) => { user = value; },
    unmount: () => { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

function find(tree, type) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (tree.type === type) return tree;
  for (const child of tree.children || []) {
    const match = find(child, type);
    if (match) return match;
  }
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('detail route/account changes and unmount prevent stale content and writes', async () => {
  const app = detailHarness();
  app.render();
  app.route('route-b');
  app.render();
  assert.equal(app.requests[0].signal.aborted, true);
  app.requests[0].resolve({ id: 'route-a' });
  await settle();
  assert.equal(app.writes.length, 0);
  app.requests[1].resolve({ id: 'route-b' });
  await settle();
  assert.equal(app.writes.length, 1);
  assert.equal(app.writes[0].id, 'route-b');

  app.account({ id: 'account-b', role: 'patient', accessToken: 'b' });
  const switched = app.render();
  assert.equal(find(switched, 'Avatar'), undefined, 'old account content must disappear immediately');
  app.account({ id: 'account-c', role: 'patient', accessToken: 'c' });
  app.render();
  app.requests[2].reject(new Error('old account error'));
  await settle();
  assert.equal(app.slots[3], '', 'obsolete failures cannot replace the new account error state');
  app.unmount();
  app.requests[3].resolve({ id: 'route-b' });
  await settle();
  assert.equal(app.writes.length, 1);
});

test('detail duplicate refresh deduplicates and wrong-id responses are rejected', async () => {
  const app = detailHarness();
  app.render();
  app.requests[0].resolve({ id: 'route-a' });
  await settle();
  const tree = app.render();
  const refresh = find(tree, 'ScrollView').props.refreshControl.props.onRefresh;
  refresh();
  refresh();
  assert.equal(app.requests.length, 2);
  app.requests[1].resolve({ id: 'wrong-id' });
  await settle();
  assert.equal(app.writes.length, 1);
  assert.match(app.slots[3], /requested prescription/);
  assert.equal(app.slots[2], false, 'refresh spinner stops for the active failure');
});
