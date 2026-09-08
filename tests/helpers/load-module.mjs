import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire = createRequire(import.meta.url);

// Load real application modules, substituting only external boundaries. Never load .env.
export function load(file, mocks = {}, env = {}, extra = '') {
  const root = process.cwd(), cache = new Map();
  function inner(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = fs.readFileSync(filename, 'utf8') + (filename === path.resolve(root, file) ? extra : '');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const req = (id) => {
      if (id in mocks) return mocks[id];
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(filename), id);
        for (const suffix of ['', '.ts', '.tsx']) if (fs.existsSync(base + suffix) && fs.statSync(base + suffix).isFile()) return inner(base + suffix);
      }
      return nativeRequire(id);
    };
    vm.runInNewContext('(function(require,module,exports){' + compiled + '\n})', {
      process: { env: { KAYART_DATA_SOURCE: 'prisma', NODE_ENV: 'test', ...env }, cwd: () => root },
      URL, FormData, File, Blob, Buffer, Headers, Request, Response, console, Date, Math, setTimeout, clearTimeout,
      fetch: () => { throw new Error('Unexpected network access in regression test'); }
    })(req, module, module.exports);
    return module.exports;
  }
  return inner(file);
}
