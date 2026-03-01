import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
(globalThis as any).global = globalThis;
const proc = (globalThis as any).process || {};
(globalThis as any).process = {
  ...proc,
  env: proc.env || {},
  argv: proc.argv || ['browser'],
  cwd: proc.cwd || (() => '/'),
  browser: true,
  stdout: proc.stdout || { isTTY: false },
  stderr: proc.stderr || { isTTY: false },
};
