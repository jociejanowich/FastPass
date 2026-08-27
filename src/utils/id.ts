let counter = 0;

/** Stable-enough unique id for client-only entities (assistant messages). */
export function createId(prefix = 'id'): string {
  counter += 1;
  const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return `${prefix}-${globalCrypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
