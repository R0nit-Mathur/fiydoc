const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const processColor = require('react-native-web/dist/cjs/exports/processColor');

const root = path.join(__dirname, '..');

function load(file, imports) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    module,
    exports: module.exports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return module.exports;
}

function platform(os) {
  return { OS: os, select: (options) => options[os] ?? options.default };
}

function shadowHelper(os) {
  return load('src/utils/platformStyles.ts', {
    'react-native': { Platform: platform(os), processColor },
  });
}

const nativeShadow = {
  shadowColor: '#1450a3',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 3,
};

test('web shadows use boxShadow without deprecated native shadow keys', () => {
  const { platformShadow } = shadowHelper('web');
  const style = platformShadow(nativeShadow);
  assert.deepEqual(Object.keys(style), ['boxShadow']);
  assert.equal(style.boxShadow, '0px -4px 8px rgba(20, 80, 163, 0.25)');
  assert.equal(platformShadow({ shadowColor: '#000', shadowOpacity: 0 }).boxShadow,
    '0px 0px 0px rgba(0, 0, 0, 0)');
  // Use the actual installed RN Web color parser, including alpha in CSS colors.
  assert.equal(platformShadow({ shadowColor: 'rgba(0, 0, 0, 0.2)', shadowOpacity: 0.5 }).boxShadow,
    '0px 0px 0px rgba(0, 0, 0, 0.1)');
});

test('iOS and Android keep their exact native shadow and elevation definitions', () => {
  for (const os of ['ios', 'android']) {
    assert.equal(shadowHelper(os).platformShadow(nativeShadow), nativeShadow);
  }
});

test('every shared shadow token is web-safe while native tokens retain depth', () => {
  for (const os of ['web', 'ios', 'android']) {
    const { Shadows } = load('src/constants/theme.ts', {
      'react-native': { Platform: platform(os) },
      '@/utils/platformStyles': shadowHelper(os),
    });
    assert.deepEqual(Object.keys(Shadows), ['subtle', 'card', 'modal', 'focus']);
    for (const token of Object.values(Shadows)) {
      if (os === 'web') {
        assert.deepEqual(Object.keys(token), ['boxShadow']);
      } else {
        assert.equal(typeof token.shadowOpacity, 'number');
        assert.equal(typeof token.elevation, 'number');
        assert.equal('boxShadow' in token, false);
      }
    }
  }
});

function sourceFiles(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

test('owned styles keep shadows platform-scoped, overlays in style, and drivers native-only', () => {
  const excluded = new Set([
    'src/app/(doctor)/(tabs)/home.tsx',
    'src/app/(doctor)/(tabs)/profile.tsx',
  ]);
  const files = ['src/constants/theme.ts', ...[
    'src/components', 'src/app/(auth)', 'src/app/(onboarding)',
    'src/app/(patient)', 'src/app/(doctor)',
  ].flatMap(sourceFiles)].filter((file) => !excluded.has(file));

  for (const file of files) {
    const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'),
      ts.ScriptTarget.Latest, true);
    function visit(node) {
      const location = `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;
      if (ts.isJsxAttribute(node)) {
        assert.notEqual(node.name.getText(source), 'pointerEvents', location);
      }
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'useNativeDriver') {
        assert.equal(node.initializer.getText(source), "Platform.OS !== 'web'", location);
      }
      if (ts.isPropertyAssignment(node) && /^shadow(Color|Offset|Radius|Opacity)$/.test(node.name.getText(source))) {
        let ancestor = node.parent;
        let guarded = false;
        while (ancestor) {
          if (ts.isCallExpression(ancestor) && ancestor.expression.getText(source) === 'platformShadow') {
            guarded = true;
            break;
          }
          if (ts.isPropertyAssignment(ancestor) && ['ios', 'android', 'native'].includes(ancestor.name.getText(source))) {
            const call = ancestor.parent.parent;
            if (ts.isCallExpression(call) && call.expression.getText(source) === 'Platform.select') {
              guarded = true;
              break;
            }
          }
          ancestor = ancestor.parent;
        }
        assert.ok(guarded, `Unguarded legacy shadow at ${location}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
