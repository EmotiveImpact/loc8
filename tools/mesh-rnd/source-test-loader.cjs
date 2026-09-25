'use strict';
// Shared test support for source-sample regression checks, not an app dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.env.LOC8_SOURCE_ROOT || path.resolve(__dirname, '../..');
function createLoader(mocks = {}, time = { wall: 1_800_000_000_000, elapsed: 100 }) {
  const cache = new Map();
  class ClockDate extends Date { static now() { return time.wall; } }
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, reportDiagnostics: true, compilerOptions: {
        strict: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      },
    });
    assert.equal((output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file);
    const module = { exports: {} }; cache.set(file, module);
    const requireSource = spec => {
      if (Object.hasOwn(mocks, spec)) {
        const mock = mocks[spec];
        // Explicit default-export mocks represent an ES module namespace.
        // Preserve that shape across TypeScript interop modes, like real modules.
        return mock != null &&
          (typeof mock === 'object' || typeof mock === 'function') &&
          Object.hasOwn(mock, 'default') && !Object.hasOwn(mock, '__esModule')
          ? { ...mock, __esModule: true }
          : mock;
      }
      assert.ok(spec.startsWith('.'), `Unmocked external dependency ${spec}`);
      const base = path.resolve(path.dirname(file), spec);
      const target = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(fs.existsSync);
      assert.ok(target, `Missing actual dependency ${base}`); return load(target);
    };
    vm.runInThisContext(`(function(require,module,exports,Date,performance){\n${output.outputText}\n})`, { filename: file })(
      requireSource, module, module.exports, ClockDate, { now: () => time.elapsed * 1000 });
    return module.exports;
  }
  return load;
}
function stateMock() {
  return { create(init) {
    let state;
    const get = () => state;
    const set = next => { state = { ...state, ...(typeof next === 'function' ? next(state) : next) }; };
    state = init(set, get);
    const use = (selector = s => s) => selector(state);
    return Object.assign(use, { getState: get, setState: set });
  } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
module.exports = { createLoader, stateMock, flush, deferred, root };
