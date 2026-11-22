import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/pwaUpdates.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { watchForServiceWorkerUpdates } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const settle = () => new Promise(resolve => setImmediate(resolve));
function environment() {
 const descriptors = Object.fromEntries(['window','document','navigator'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
 const window = new EventTarget();
 const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
 const navigator = { onLine: true };
 for (const [key, value] of Object.entries({ window, document, navigator })) Object.defineProperty(globalThis, key, { configurable: true, value });
 let now = 100000;
 const oldNow = Date.now;
 Date.now = () => now;
 return { window, document, navigator, advance() { now += 61000; }, restore() { Date.now = oldNow; for (const [key, descriptor] of Object.entries(descriptors)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } } };
}
test('launch and foreground resume check for updates without duplicate focus requests', async () => {
 const env = environment(); let calls = 0; let dispose;
 try {
  dispose = watchForServiceWorkerUpdates({ update: async () => { calls++; } });
  await settle(); assert.equal(calls, 1);
  env.window.dispatchEvent(new Event('focus')); await settle(); assert.equal(calls, 1);
  env.advance(); env.document.visibilityState = 'hidden';
  env.document.dispatchEvent(new Event('visibilitychange')); await settle(); assert.equal(calls, 1);
  env.document.visibilityState = 'visible'; env.document.dispatchEvent(new Event('visibilitychange'));
  env.window.dispatchEvent(new Event('pageshow')); await settle(); assert.equal(calls, 2);
  dispose(); env.advance(); env.window.dispatchEvent(new Event('focus')); await settle(); assert.equal(calls, 2);
 } finally { dispose?.(); env.restore(); }
});
test('offline launch waits for reconnection and failed checks can retry', async () => {
 const env = environment(); let calls = 0; let dispose;
 try {
  env.navigator.onLine = false;
  dispose = watchForServiceWorkerUpdates({ update: async () => { calls++; if (calls === 1) throw new Error('network'); } });
  await settle(); assert.equal(calls, 0);
  env.navigator.onLine = true; env.window.dispatchEvent(new Event('online')); await settle(); assert.equal(calls, 1);
  env.window.dispatchEvent(new Event('focus')); await settle(); assert.equal(calls, 2);
 } finally { dispose?.(); env.restore(); }
});
