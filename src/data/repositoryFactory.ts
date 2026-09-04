/**
 * Chooses the repository implementation from environment configuration.
 * Defaults to the mock so the demo always works with no secrets.
 */

import { DataverseFastPassRepository } from './DataverseFastPassRepository';
import type { FastPassRepository } from './FastPassRepository';
import { MockFastPassRepository } from './MockFastPassRepository';
import { getDataSourcesInfo } from './powerAppsDataSources';

export function createRepository(): FastPassRepository {
  const source = import.meta.env.VITE_FASTPASS_DATA_SOURCE ?? 'mock';

  if (source === 'dataverse') {
    try {
      return new DataverseFastPassRepository(getDataSourcesInfo());
    } catch (error) {
      console.warn(
        '[FastPass] VITE_FASTPASS_DATA_SOURCE=dataverse but the data source is not configured ' +
          'yet (see powerAppsDataSources.ts). Falling back to mock data.',
        error,
      );
      return new MockFastPassRepository();
    }
  }

  return new MockFastPassRepository();
}
