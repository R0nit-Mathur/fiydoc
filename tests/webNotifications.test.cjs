const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function load(file, imports = {}, globals = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    module, exports: module.exports, ...globals,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return module.exports;
}

test('web push hook and local banners never load expo-notifications', async () => {
  assert.equal(load('src/hooks/usePushNotifications.web.ts').usePushNotifications().expoPushToken, null);
  await load('src/services/localNotifications.web.ts').scheduleLocalNotification({ title: 'Example', body: 'Example' });
  for (const file of ['src/store/useNotificationStore.ts', 'src/services/notificationService.ts']) {
    assert.ok(!fs.readFileSync(path.join(root, file), 'utf8').includes("from 'expo-notifications'"));
  }
});

test('native local banners retain recorded content and sound', async () => {
  let request;
  const service = load('src/services/localNotifications.ts', {
    'expo-notifications': { scheduleNotificationAsync: async (value) => { request = value; } },
  });
  await service.scheduleLocalNotification({ title: 'Title', body: 'Body', data: { type: 'appointment' } });
  assert.deepEqual(JSON.parse(JSON.stringify(request)), { content: { title: 'Title', body: 'Body', data: { type: 'appointment' }, sound: 'default' }, trigger: null });
});

test('update service does not call native OTA APIs in development or web', async () => {
  for (const [os, dev] of [['web', false], ['web', true], ['ios', true], ['android', true]]) {
    const service = load('src/services/updateService.ts', {
      'react-native': { Platform: { OS: os } },
      'expo-updates': { isEnabled: true, checkForUpdateAsync: () => assert.fail('OTA check called'), fetchUpdateAsync: () => assert.fail('OTA fetch called') },
    }, { __DEV__: dev }).updateService;
    assert.equal(service.isEnabled(), false);
    assert.equal((await service.checkForUpdate()).isAvailable, false);
    assert.equal((await service.fetchAndApplyUpdate()).success, false);
  }
  const source = fs.readFileSync(path.join(root, 'src/app/_layout.tsx'), 'utf8');
  assert.match(source, /if \(__DEV__ \|\| Platform\.OS === 'web' \|\| !Updates\.isEnabled\) return;/);
});

test('release native update service still checks and applies available updates', async () => {
  let reloads = 0;
  const service = load('src/services/updateService.ts', {
    'react-native': { Platform: { OS: 'ios' } },
    'expo-updates': { isEnabled: true, checkForUpdateAsync: async () => ({ isAvailable: true }), fetchUpdateAsync: async () => ({ isNew: true }), reloadAsync: async () => { reloads++; } },
  }, { __DEV__: false }).updateService;
  assert.equal((await service.checkForUpdate()).isAvailable, true);
  assert.equal((await service.fetchAndApplyUpdate()).success, true);
  assert.equal(reloads, 1);
});
