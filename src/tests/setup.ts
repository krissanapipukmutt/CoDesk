import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => webcrypto.randomUUID();
}
