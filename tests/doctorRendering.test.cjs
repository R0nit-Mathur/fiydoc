const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const sourceFor = (screen) => fs.readFileSync(path.join(__dirname, `../src/app/(doctor)/(tabs)/${screen}.tsx`), 'utf8');
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const settle = () => new Promise((resolve) => setImmediate(resolve));

// Execute the actual TSX with deterministic hooks and native host elements.
// This checks emitted JSX and screen handlers without React Native, network,
// or a renderer dependency; it is not a device/visual integration test.
function screenHarness(screen, { source = sourceFor(screen), query = {}, stored = [], user, getProfile, updateProfile } = {}) {
  const state = [], refs = [], effects = [], cleanups = [], updates = [], calls = [];
  let stateIndex = 0, refIndex = 0, didMount = false;
  const session = { user: user || { id: 'doctor-1', role: 'doctor', verificationStatus: 'verified', name: 'Saved Name', specialization: 'Saved Specialty', consultationFee: 400 } };
  const updateUser = (patch) => { updates.push(patch); session.user = { ...session.user, ...patch }; };
  const authStore = Object.assign(() => ({ user: session.user, updateUser }), { getState: () => session });
  const animation = new Proxy({}, { get: () => () => animation });
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef: (initial) => {
      const index = refIndex++;
      return refs[index] || (refs[index] = { current: initial });
    },
    useMemo: (fn) => fn(),
    useEffect: (fn) => { if (!didMount) effects.push(fn); },
  };
  const native = new Proxy({
    StyleSheet: { create: (styles) => styles, hairlineWidth: 1, absoluteFill: {} },
    Platform: { OS: 'web', select: (choices) => choices.web || choices.default },
    Alert: { alert: () => {} },
  }, { get: (target, key) => target[key] || String(key) });
  const imports = {
    react,
    'react-native': native,
    'expo-router': { useRouter: () => ({ push: () => {}, replace: () => {} }) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'react-native-reanimated': { __esModule: true, default: { View: 'Animated.View' }, FadeInUp: animation, FadeInDown: animation, ReduceMotion: { System: 'system' } },
    'expo-haptics': {},
    'expo-blur': { BlurView: 'BlurView' },
    'lucide-react-native': new Proxy({}, { get: (_target, key) => String(key) }),
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    '@/store/useAuthStore': { useAuthStore: authStore },
    '@/store/useAppointmentStore': { useAppointmentStore: (selector) => selector ? selector({ appointments: stored }) : { appointments: stored } },
    '@/store/useNotificationStore': { useNotificationStore: { getState: () => ({ addNotification: () => {} }) } },
    '@/hooks/queries/useAppointmentsQuery': { useAppointmentsQuery: () => ({ data: [], refetch: async () => calls.push('queue'), ...query }) },
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {}, isDark: false }) },
    '@/constants/theme': { StitchColors: {}, BorderRadius: {}, Shadows: {}, Spacing: {}, Palette: {} },
    '@/utils/formatters': { getDoctorFirstName: () => 'Saved' },
    '@/utils/mediaPicker': { pickImageFromGallery: async () => undefined },
    '@/services/authService': { signOutAll: async () => { throw new Error('Unexpected sign-out'); } },
    '@/services/doctorService': { doctorService: {
      getMyProfile: () => { calls.push('profile'); return getProfile ? getProfile() : Promise.resolve({}); },
      updateMyProfile: async (payload) => updateProfile ? updateProfile(payload) : ({}),
    } },
    '@/services/fileUploadService': { fileUploadService: {} },
  };
  const module = { exports: {} };
  vm.runInNewContext(transpile(source), {
    module, exports: module.exports,
    require: (name) => {
      if (name in imports) return imports[name];
      if (name.startsWith('@/components/')) return new Proxy({}, { get: (_target, key) => String(key) });
      throw new Error(`Unexpected import ${name}`);
    },
    console: { warn: () => {} },
  });
  return {
    calls, updates, session,
    render: () => { stateIndex = 0; refIndex = 0; return module.exports.default(); },
    mount: () => { didMount = true; for (const effect of effects) cleanups.push(effect()); },
    unmount: () => { for (const cleanup of cleanups) if (cleanup) cleanup(); },
  };
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...tree.children.flatMap(nodes)];
}
function text(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return tree && typeof tree === 'object' ? tree.children.map(text).join(' ') : '';
}
function labeled(tree, label) {
  const found = nodes(tree).find((node) => node.props.accessibilityLabel === label);
  assert.ok(found, `Missing accessible control: ${label}`);
  return found;
}
function directTextIssues(tree) {
  return nodes(tree).filter((node) => node.type !== 'Text' && node.children.some((child) => typeof child === 'string' || typeof child === 'number'));
}
function inputWithValue(tree, value) {
  const found = nodes(tree).find((node) => node.type === 'TextInput' && node.props.value === value);
  assert.ok(found, `Missing input value: ${value}`);
  return found;
}

test('actual home loading JSX reproduces the inline-whitespace bug before the fix', () => {
  const source = sourceFor('home');
  const broken = source.replace(/(<View[^\n]*styles\.queueLoading[^\n]*>)\n\s*(?=<ActivityIndicator)/, '$1              ');
  assert.notEqual(broken, source, 'The regression fixture must mutate the actual loading View');
  const tree = screenHarness('home', { source: broken, query: { isLoading: true } }).render();
  const issues = directTextIssues(tree);
  assert.equal(issues.length, 1);
  assert.ok(issues[0].children.includes('              '), 'TypeScript emits the literal whitespace child');
});

test('both screens have no JSX literal text emitted directly into non-Text containers', () => {
  for (const screen of ['home', 'profile']) {
    const source = sourceFor(screen);
    const ast = ts.createSourceFile(`${screen}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) !== 'Text') {
        for (const child of node.children.filter(ts.isJsxText)) {
          const raw = source.slice(child.pos, child.end);
          const context = { React: { createElement: reactElement }, View: 'View', result: null };
          vm.runInNewContext(transpile(`result = <View>${raw}</View>;`), context);
          assert.equal(directTextIssues(context.result).length, 0, `${screen}:${ast.getLineAndCharacterOfPosition(child.pos).line + 1}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  function reactElement(type, props, ...children) { return { type, props: props || {}, children }; }
});

test('home loading/error states are safe and do not claim a failed queue is complete', async () => {
  const loading = screenHarness('home', { query: { isLoading: true } }).render();
  assert.equal(directTextIssues(loading).length, 0);
  assert.match(text(loading), /Loading today's queue/);
  assert.doesNotMatch(text(loading), /Queue complete/);
  const app = screenHarness('home', { query: { isError: true } });
  const tree = app.render();
  assert.equal(directTextIssues(tree).length, 0);
  assert.match(text(tree), /Unable to refresh today's queue/);
  assert.doesNotMatch(text(tree), /Queue complete|No more patients/);
  await labeled(tree, "Retry loading today's queue").props.onPress();
  assert.deepEqual(app.calls, ['queue']);
  const retrying = screenHarness('home', { query: { isError: true, isFetching: true } }).render();
  assert.equal(labeled(retrying, "Retry loading today's queue").props.disabled, true);
});

test('home failed refresh keeps cached appointments visible', () => {
  const date = new Date().toISOString().slice(0, 10);
  const tree = screenHarness('home', { query: { isError: true }, stored: [{ id: 'apt-1', doctorId: 'doctor-1', date, time: '10:00', status: 'confirmed', patientName: 'Saved Patient' }] }).render();
  assert.match(text(tree), /Saved Patient/);
  assert.match(text(tree), /Showing saved appointments/);
  assert.equal(directTextIssues(tree).length, 0);
});

test('profile timeout is nonblocking, preserves session, and retries once without overwriting draft', async () => {
  const first = deferred(), retry = deferred();
  let attempt = 0;
  const app = screenHarness('profile', { getProfile: () => (++attempt === 1 ? first.promise : retry.promise) });
  let tree = app.render();
  app.mount();
  assert.match(text(tree), /Refreshing your profile/);
  assert.match(text(tree), /Saved Name/);
  first.reject(new Error('Request timed out'));
  await settle();
  tree = app.render();
  assert.match(text(tree), /Unable to refresh your profile/);
  assert.deepEqual(app.updates, []);
  assert.equal(app.session.user.id, 'doctor-1');
  labeled(tree, 'Edit clinician profile').props.onPress();
  tree = app.render();
  inputWithValue(tree, 'Saved Name').props.onChangeText('Unsaved Name');
  tree = app.render();
  const retryButton = labeled(tree, 'Retry loading your profile');
  const request = retryButton.props.onPress();
  await retryButton.props.onPress();
  tree = app.render();
  assert.equal(labeled(tree, 'Retry loading your profile').props.disabled, true);
  assert.equal(app.calls.length, 2, 'No duplicate requests');
  retry.resolve({ user: { fullName: 'Server Name' }, consultationFee: 900 });
  await request;
  tree = app.render();
  assert.equal(inputWithValue(tree, 'Unsaved Name').props.value, 'Unsaved Name');
  assert.deepEqual(app.updates, []);
  assert.equal(app.session.user.name, 'Saved Name');
  assert.doesNotMatch(text(tree), /Unable to refresh your profile|Refreshing your profile/);
  assert.equal(directTextIssues(tree).length, 0);
});

test('successful profile retry without edits applies server values, including zero', async () => {
  const first = deferred();
  let attempt = 0;
  const app = screenHarness('profile', { getProfile: () => (++attempt === 1 ? first.promise : Promise.resolve({ fullName: 'Server Name', consultationFee: 0, experienceYears: 0 })) });
  app.render(); app.mount();
  first.reject(new Error('timeout')); await settle();
  await labeled(app.render(), 'Retry loading your profile').props.onPress();
  assert.equal(app.session.user.name, 'Server Name');
  assert.equal(app.session.user.consultationFee, '0');
  assert.equal(app.session.user.experienceYears, 0);
});

test('failed retry keeps an open unsaved profile draft and can be retried again', async () => {
  const app = screenHarness('profile', { getProfile: () => Promise.reject(new Error('timeout')) });
  app.render(); app.mount(); await settle();
  labeled(app.render(), 'Edit clinician profile').props.onPress();
  inputWithValue(app.render(), 'Saved Name').props.onChangeText('Unsaved after timeout');
  await labeled(app.render(), 'Retry loading your profile').props.onPress();
  const tree = app.render();
  assert.equal(inputWithValue(tree, 'Unsaved after timeout').props.value, 'Unsaved after timeout');
  assert.match(text(tree), /Unable to refresh your profile/);
  assert.equal(labeled(tree, 'Retry loading your profile').props.disabled, false);
  assert.deepEqual(app.updates, []);
});

test('successful background profile read cannot reset an open fee draft', async () => {
  const pending = deferred();
  const app = screenHarness('profile', { getProfile: () => pending.promise });
  let tree = app.render(); app.mount();
  nodes(tree).find((node) => node.type === 'Pressable' && text(node).includes('Edit Fee')).props.onPress();
  inputWithValue(app.render(), '400').props.onChangeText('650');
  app.render();
  pending.resolve({ consultationFee: 900 }); await settle();
  assert.equal(inputWithValue(app.render(), '650').props.value, '650');
  assert.equal(app.session.user.consultationFee, 400);
  assert.deepEqual(app.updates, []);
});

test('unverified home branch also has no direct text children', () => {
  const tree = screenHarness('home', { user: { id: 'doctor-1', verificationStatus: 'pending' } }).render();
  assert.equal(directTextIssues(tree).length, 0);
  assert.match(text(tree), /Verification in Progress/);
  assert.equal(labeled(tree, 'Check verification status').props.accessibilityRole, 'button');
});

test('late initial profile read cannot overwrite a profile saved while loading', async () => {
  const pending = deferred();
  const app = screenHarness('profile', { getProfile: () => pending.promise });
  let tree = app.render(); app.mount();
  labeled(tree, 'Edit clinician profile').props.onPress();
  tree = app.render();
  inputWithValue(tree, 'Saved Name').props.onChangeText('New Saved Name');
  tree = app.render();
  const save = nodes(tree).find((node) => node.type === 'Pressable' && text(node).includes('Save Changes'));
  await save.props.onPress();
  app.render();
  pending.resolve({ fullName: 'Outdated Server Name' }); await settle();
  assert.equal(app.session.user.name, 'New Saved Name');
  assert.equal(app.updates.length, 1, 'Only the save updates the session');
});

test('profile response is ignored after session changes or unmount', async () => {
  for (const disposition of ['session', 'unmount']) {
    const pending = deferred();
    const app = screenHarness('profile', { getProfile: () => pending.promise });
    app.render(); app.mount();
    if (disposition === 'session') app.session.user = { id: 'doctor-2', name: 'Other session' };
    else app.unmount();
    pending.resolve({ fullName: 'Old session profile' }); await settle();
    assert.deepEqual(app.updates, []);
  }
});

test('failed profile save preserves saved user and editable draft', async () => {
  const app = screenHarness('profile', { updateProfile: async () => { throw new Error('server unavailable'); } });
  app.render();
  labeled(app.render(), 'Edit clinician profile').props.onPress();
  inputWithValue(app.render(), 'Saved Name').props.onChangeText('Unsaved Name');
  const save = nodes(app.render()).find((node) => node.type === 'Pressable' && text(node).includes('Save Changes'));
  await save.props.onPress();
  assert.equal(app.session.user.name, 'Saved Name');
  assert.equal(app.updates.length, 0);
  assert.equal(inputWithValue(app.render(), 'Unsaved Name').props.value, 'Unsaved Name');
});

test('failed fee save does not change fee or report local success', async () => {
  const app = screenHarness('profile', { updateProfile: async () => { throw new Error('server unavailable'); } });
  nodes(app.render()).find((node) => node.type === 'Pressable' && text(node).includes('Edit Fee')).props.onPress();
  inputWithValue(app.render(), '400').props.onChangeText('650');
  const save = labeled(app.render(), 'Save consultation fee');
  assert.ok(save, 'fee save button exists');
  await save.props.onPress();
  assert.equal(app.session.user.consultationFee, 400);
  assert.equal(app.updates.length, 0);
  assert.equal(inputWithValue(app.render(), '650').props.value, '650');
});
