/**
 * PLACEHOLDER — this is NOT the real `pa app add data-source` output.
 *
 * The real version of this file is environment-specific metadata (table ids,
 * generated API shapes) that only `pa` can produce, and it already exists on
 * whatever machine has run `pa app add data-source` against the live
 * environment (see README → "Connecting a real Power Platform environment").
 * This stand-in exists only so `npm run build` / `npm run typecheck` succeed
 * in this repository without a live Dataverse connection — e.g. for the
 * GitHub Pages build, which always runs on mock data and never actually
 * calls into this file at runtime. Do not replace a working local copy with
 * this one.
 */

export const dataSourcesInfo = {
  fastpass_employees: { tableId: 'placeholder-employees', apis: {} },
  fastpass_employeetasks: { tableId: 'placeholder-employeetasks', apis: {} },
  fastpass_milestones: { tableId: 'placeholder-milestones', apis: {} },
  fastpass_resources: { tableId: 'placeholder-resources', apis: {} },
};
