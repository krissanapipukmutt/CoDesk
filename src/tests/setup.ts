import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  // @ts-expect-error polyfill for tests
  globalThis.crypto = webcrypto;
}

if (!globalThis.crypto.randomUUID) {
  // @ts-expect-error polyfill randomUUID
  globalThis.crypto.randomUUID = () => webcrypto.randomUUID();
}
