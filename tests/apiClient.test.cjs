const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/services/apiClient.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function harness({ authenticated = true, fetchImpl, getToken } = {}) {
  const subscribers = new Set();
  const timers = new Map();
  const calls = [];
  const signOuts = [];
  let cachedToken = authenticated ? 'token-a' : null;
  let state = {
    user: authenticated ? { id: 'account-a', accessToken: 'token-a' } : null,
    isAuthenticated: authenticated,
    signOutAll: async (reason) => { signOuts.push(reason); },
  };
  const store = {
    getState: () => state,
    subscribe: (listener) => { subscribers.add(listener); return () => subscribers.delete(listener); },
  };
  const tokenStorage = {
    getCachedToken: () => cachedToken,
    getToken: getToken || (async () => cachedToken),
  };
  const context = {
    exports: {},
    require: (name) => {
      if (name === '@/store/useAuthStore') return { useAuthStore: store };
      if (name === '@/utils/tokenStorage') return { tokenStorage };
      throw new Error(`Unexpected import: ${name}`);
    },
    process: { env: {} },
    console: { warn() {} },
    AbortController,
    Error,
    setTimeout: (callback, delay) => { const id = {}; timers.set(id, { callback, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    fetch: (url, options) => {
      calls.push({ url, options });
      return fetchImpl ? fetchImpl(url, options) : Promise.resolve(response({ value: 1 }));
    },
  };
  vm.runInNewContext(source, context, { filename: 'apiClient.js' });
  return {
    apiClient: context.exports.apiClient,
    calls,
    timers,
    subscribers,
    signOuts,
    switchSession(id = 'account-b', token = 'token-b') {
      cachedToken = token;
      const previous = state;
      state = { ...state, user: id ? { id, accessToken: token } : null, isAuthenticated: Boolean(id) };
      for (const listener of subscribers) listener(state, previous);
    },
    updateProfile() {
      const previous = state;
      state = { ...state, user: { ...state.user, name: 'Updated name' } };
      for (const listener of subscribers) listener(state, previous);
    },
    expire() {
      for (const { callback, delay } of [...timers.values()]) {
        assert.equal(delay, 12_000);
        callback();
      }
    },
  };
}

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function abortable(signal) {
  return new Promise((_, reject) => {
    const abort = () => reject(signal.reason || Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

test('caller signal cannot bypass the 12-second timeout', async () => {
  const caller = new AbortController();
  const h = harness({ fetchImpl: (_, { signal }) => abortable(signal) });
  const request = h.apiClient('/patient', { signal: caller.signal });
  const rejected = assert.rejects(request, /request took too long/);
  h.expire();
  await rejected;
  assert.equal(caller.signal.aborted, false);
  assert.equal(h.timers.size, 0);
});

test('timeout stays active while the successful response body is read', async () => {
  let bodyStarted;
  const started = new Promise((resolve) => { bodyStarted = resolve; });
  const h = harness({ fetchImpl: async (_, { signal }) => ({
    ok: true, status: 200,
    json: () => { bodyStarted(); return abortable(signal); },
  }) });
  const request = h.apiClient('/patient');
  const rejected = assert.rejects(request, /request took too long/);
  await started;
  assert.equal(h.timers.size, 1);
  h.expire();
  await rejected;
  assert.equal(h.timers.size, 0);
});

test('caller cancellation preserves AbortError and removes the forwarding listener', async () => {
  const caller = new AbortController();
  let added = 0;
  let removed = 0;
  const add = caller.signal.addEventListener.bind(caller.signal);
  const remove = caller.signal.removeEventListener.bind(caller.signal);
  caller.signal.addEventListener = (...args) => { added++; return add(...args); };
  caller.signal.removeEventListener = (...args) => { removed++; return remove(...args); };
  const h = harness({ fetchImpl: (_, { signal }) => abortable(signal) });
  const request = h.apiClient('/patient', { signal: caller.signal });
  const rejected = assert.rejects(request, { name: 'AbortError' });
  caller.abort();
  await rejected;
  assert.equal(added, 1);
  assert.equal(removed, 1);
  assert.equal(h.timers.size, 0);
  assert.equal(h.subscribers.size, 0);
});

test('an already cancelled request is not sent', async () => {
  const caller = new AbortController();
  caller.abort();
  const h = harness();
  await assert.rejects(h.apiClient('/patient', { signal: caller.signal }), { name: 'AbortError' });
  assert.equal(h.calls.length, 0);
  assert.equal(h.timers.size, 0);
});

test('a late 401 from the previous account never signs out the current account', async () => {
  const fetched = deferred();
  const h = harness({ fetchImpl: () => fetched.promise });
  const request = h.apiClient('/patient');
  const rejected = assert.rejects(request, /session changed/i);
  h.switchSession();
  fetched.resolve(response({ message: 'Unauthorized' }, 401));
  await rejected;
  assert.deepEqual(h.signOuts, []);
  assert.equal(h.subscribers.size, 0);
});

test('a successful obsolete response is rejected before its body can reach a caller', async () => {
  const fetched = deferred();
  const h = harness({ fetchImpl: () => fetched.promise });
  const request = h.apiClient('/patient');
  let stored = false;
  const rejected = assert.rejects(request.then(() => { stored = true; }), /session changed/i);
  h.switchSession();
  fetched.resolve(response({ privateData: 'old account' }));
  await rejected;
  assert.equal(stored, false);
});

test('switching accounts during body parsing rejects the parsed data', async () => {
  const body = deferred();
  const started = deferred();
  const h = harness({ fetchImpl: async () => ({
    ok: true, status: 200, json: () => { started.resolve(); return body.promise; },
  }) });
  const request = h.apiClient('/patient');
  const rejected = assert.rejects(request, /session changed/i);
  await started.promise;
  h.switchSession();
  body.resolve({ privateData: 'old account' });
  await rejected;
  assert.equal(h.timers.size, 0);
});

test('signing out and back into the same account still obsoletes earlier responses', async () => {
  const fetched = deferred();
  const h = harness({ fetchImpl: () => fetched.promise });
  const request = h.apiClient('/patient');
  const rejected = assert.rejects(request, /session changed/i);
  h.switchSession(null, null);
  h.switchSession('account-a', 'token-a');
  fetched.resolve(response({ privateData: 'previous session' }));
  await rejected;
});

test('a current authenticated 401 expires the session', async () => {
  const h = harness({ fetchImpl: async () => response({}, 401) });
  await assert.rejects(h.apiClient('/patient'), /Session Expired/);
  assert.deepEqual(h.signOuts, ['SESSION_EXPIRED']);
});

test('unauthenticated and login/register 401s do not sign out a session', async () => {
  for (const endpoint of ['/auth/login', '/auth/register', '/auth/google']) {
    const h = harness({ authenticated: false, fetchImpl: async () => response({ message: 'Invalid credentials' }, 401) });
    await assert.rejects(h.apiClient(endpoint), /Invalid credentials/);
    assert.deepEqual(h.signOuts, []);
  }
  for (const endpoint of ['/auth/login', '/auth/register']) {
    const h = harness({ fetchImpl: async () => response({ message: 'Invalid credentials' }, 401) });
    await assert.rejects(h.apiClient(endpoint), /Invalid credentials/);
    assert.deepEqual(h.signOuts, []);
  }
});

test('204 succeeds without trying to decode an empty JSON body', async () => {
  const h = harness({ fetchImpl: async () => ({
    ok: true, status: 204, json: () => { throw new Error('Should not parse 204'); },
  }) });
  assert.equal(await h.apiClient.delete('/patient/record'), undefined);
  assert.equal(h.timers.size, 0);
  assert.equal(h.subscribers.size, 0);
});

test('profile-only updates do not invalidate an authenticated response', async () => {
  const fetched = deferred();
  const h = harness({ fetchImpl: () => fetched.promise });
  const request = h.apiClient('/patient');
  h.updateProfile();
  fetched.resolve(response({ value: 1 }));
  assert.deepEqual(await request, { value: 1 });
});

test('an account change during asynchronous token loading prevents a stale request', async () => {
  const token = deferred();
  const h = harness({ authenticated: false, getToken: () => token.promise });
  const request = h.apiClient('/patient');
  const rejected = assert.rejects(request, /session changed/i);
  h.switchSession();
  token.resolve('token-a');
  await rejected;
  assert.equal(h.calls.length, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.subscribers.size, 0);
});

test('timeout during an error body read is not swallowed as an API error', async () => {
  const started = deferred();
  const h = harness({ fetchImpl: async (_, { signal }) => ({
    ok: false, status: 500,
    json: () => { started.resolve(); return abortable(signal); },
  }) });
  const request = h.apiClient('/patient');
  const rejected = assert.rejects(request, /request took too long/);
  await started.promise;
  h.expire();
  await rejected;
  assert.equal(h.timers.size, 0);
  assert.equal(h.subscribers.size, 0);
});

test('completed requests stop forwarding later caller cancellations', async () => {
  const caller = new AbortController();
  const h = harness();
  await h.apiClient('/patient', { signal: caller.signal });
  caller.abort();
  assert.equal(h.calls[0].options.signal.aborted, false);
  assert.equal(h.timers.size, 0);
  assert.equal(h.subscribers.size, 0);
});

test('body decoding failures and network failures clean up request resources', async () => {
  for (const fetchImpl of [
    async () => { throw new Error('Network unavailable'); },
    async () => ({ ok: true, status: 200, json: async () => { throw new Error('Invalid JSON'); } }),
  ]) {
    const h = harness({ fetchImpl });
    await assert.rejects(h.apiClient('/patient'), /Network unavailable|Invalid JSON/);
    assert.equal(h.timers.size, 0);
    assert.equal(h.subscribers.size, 0);
  }
});
