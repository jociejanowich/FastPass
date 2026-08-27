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
    const environmentUrl = import.meta.env.VITE_DATAVERSE_ENVIRONMENT_URL ?? '';
    const clientId = import.meta.env.VITE_DATAVERSE_CLIENT_ID ?? '';
    const tenantId = import.meta.env.VITE_DATAVERSE_TENANT_ID ?? '';
    if (!environmentUrl) {
      console.warn(
        '[FastPass] VITE_FASTPASS_DATA_SOURCE=dataverse but VITE_DATAVERSE_ENVIRONMENT_URL is not set. Falling back to mock data.',
      );
      return new MockFastPassRepository();
    }
    return new DataverseFastPassRepository({ environmentUrl, clientId, tenantId });
  }

  return new MockFastPassRepository();
}
