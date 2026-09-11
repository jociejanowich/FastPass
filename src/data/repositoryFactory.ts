/**
 * Chooses the repository implementation from environment configuration.
 * Defaults to the mock so the demo always works with no secrets.
 */

import { DataverseFastPassRepository } from './DataverseFastPassRepository';
import type { FastPassRepository } from './FastPassRepository';
import { MockFastPassRepository } from './MockFastPassRepository';

export function createRepository(): FastPassRepository {
  const source = import.meta.env.VITE_FASTPASS_DATA_SOURCE ?? 'mock';

  if (source === 'dataverse') {
    return new DataverseFastPassRepository();
  }

  return new MockFastPassRepository();
}
