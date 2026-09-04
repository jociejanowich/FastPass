/**
 * Placeholder for the `dataSourcesInfo` object that `pac code add-data-source`
 * generates once this project is connected to a real Power Platform
 * environment. See the README's "Connecting to a real Dataverse environment"
 * section for the exact commands.
 *
 * `pac code add-data-source` writes generated TypeScript describing each
 * connected table's schema into the project and updates `power.config.json`.
 * Once that has run against your own environment, replace the body of
 * `getDataSourcesInfo` with the object it produced (or import it from
 * wherever it landed) and set `VITE_FASTPASS_DATA_SOURCE=dataverse`.
 */

import { getClient } from '@microsoft/power-apps/data';

export function getDataSourcesInfo(): Parameters<typeof getClient>[0] {
  throw new Error(
    'powerAppsDataSources.ts is a placeholder. Run `pac code add-data-source` against your ' +
      'Power Platform environment, then replace getDataSourcesInfo() with the generated object.',
  );
}
