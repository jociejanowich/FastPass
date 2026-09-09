/**
 * One-shot Dataverse provisioner for FastPass.
 *
 * Creates the four tables + every column + the Employee lookup, then loads the
 * exact demo dataset from src/data (Cesar Martinez, Jim McDonnell's team, all
 * tasks, milestones, resources) via the Dataverse Web API.
 *
 * Run it (needs Node 20+, from the repo root):
 *
 *   npx vite-node scripts/provisionDataverse.ts -- --url https://ORG.crm.dynamics.com
 *
 * Flags:
 *   --url <https://ORG.crm.dynamics.com>   (required) your environment URL
 *   --me <you@company.com>                 UPN to key the Cesar Martinez row to
 *                                          (defaults to the signed-in user)
 *   --schema-only                          create tables/columns, skip data
 *   --data-only                            skip schema, only load data
 *   --wipe                                 delete existing FastPass rows first
 *   --client-id <guid>                     override the auth client id
 *   --tenant <guid|domain>                 override the tenant (default: organizations)
 *
 * Auth is an interactive device-code sign-in printed to the console — open the
 * URL on any device (e.g. your Surface Pro), enter the code, done. Nothing is
 * stored; the token lives only for this run.
 */

import { MOCK_EMPLOYEE, MOCK_MILESTONES, MOCK_RESOURCES, MOCK_TASKS } from '../src/data/mockData';
import { cloneTeamMembers } from '../src/data/mockTeam';
import type { Employee, EmployeeTask } from '../src/domain/types';

/* -------------------------------------------------------------------------- */
/* args                                                                        */
/* -------------------------------------------------------------------------- */

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const ORG_URL = (arg('url') ?? '').replace(/\/+$/, '');
const ME_UPN = arg('me');
const SCHEMA_ONLY = flag('schema-only');
const DATA_ONLY = flag('data-only');
const WIPE = flag('wipe');
const CLIENT_ID = arg('client-id') ?? '04b07795-8ddb-461a-bbee-02f9e1bf7b46'; // Azure CLI public client
const TENANT = arg('tenant') ?? 'organizations';

if (!ORG_URL || !/^https:\/\/.+\.dynamics\.com$/i.test(ORG_URL)) {
  console.error('Missing/invalid --url. Example: --url https://org12345.crm.dynamics.com');
  process.exit(1);
}

const API = `${ORG_URL}/api/data/v9.2`;
const L = 1033; // en-US

/* -------------------------------------------------------------------------- */
/* device-code auth                                                            */
/* -------------------------------------------------------------------------- */

async function getToken(): Promise<string> {
  const base = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0`;
  const scope = `${ORG_URL}/.default offline_access`;

  const dcRes = await fetch(`${base}/devicecode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope }),
  });
  const dc = (await dcRes.json()) as Record<string, string>;
  if (!dcRes.ok) throw new Error(`devicecode failed: ${JSON.stringify(dc)}`);

  console.log(`\n${'='.repeat(70)}\n${dc.message}\n${'='.repeat(70)}\n`);

  const interval = (Number(dc.interval) || 5) * 1000;
  const deadline = Date.now() + (Number(dc.expires_in) || 900) * 1000;

  while (Date.now() < deadline) {
    await sleep(interval);
    const tRes = await fetch(`${base}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: CLIENT_ID,
        device_code: dc.device_code as string,
      }),
    });
    const t = (await tRes.json()) as Record<string, string>;
    if (tRes.ok) {
      console.log('Signed in.\n');
      return t.access_token as string;
    }
    if (t.error === 'authorization_pending') continue;
    if (t.error === 'slow_down') {
      await sleep(interval);
      continue;
    }
    throw new Error(`Auth failed: ${t.error} — ${t.error_description ?? ''}`);
  }
  throw new Error('Device code expired before sign-in completed.');
}

/* -------------------------------------------------------------------------- */
/* web api helpers                                                             */
/* -------------------------------------------------------------------------- */

let TOKEN = '';

async function wa(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; headers: Headers; json: unknown }> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(path.startsWith('http') ? path : `${API}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if ((res.status === 429 || res.status === 503) && attempt < 5) {
      const retry = Number(res.headers.get('Retry-After')) || 5;
      await sleep(retry * 1000);
      continue;
    }
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, headers: res.headers, json };
  }
}

async function waOk(method: string, path: string, body?: unknown, extra?: Record<string, string>) {
  const r = await wa(method, path, body, extra);
  if (r.status >= 400) {
    const msg =
      r.json && typeof r.json === 'object' && 'error' in r.json
        ? JSON.stringify((r.json as { error: unknown }).error)
        : JSON.stringify(r.json);
    throw new Error(`${method} ${path} -> ${r.status}\n${msg}`);
  }
  return r;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/* metadata builders                                                           */
/* -------------------------------------------------------------------------- */

const label = (text: string) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.Label',
  LocalizedLabels: [
    { '@odata.type': 'Microsoft.Dynamics.CRM.LocalizedLabel', Label: text, LanguageCode: L },
  ],
});
const reqLevel = (value: 'None' | 'ApplicationRequired' = 'None') => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.AttributeRequiredLevelManagedProperty',
  Value: value,
});

type AttrDef = Record<string, unknown>;

const strAttr = (
  schema: string,
  display: string,
  opts: { max?: number; primary?: boolean } = {},
) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
  SchemaName: schema,
  RequiredLevel: reqLevel(),
  MaxLength: opts.max ?? 200,
  FormatName: { Value: 'Text' },
  DisplayName: label(display),
  ...(opts.primary ? { IsPrimaryName: true } : {}),
});
const memoAttr = (schema: string, display: string, max = 4000): AttrDef => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
  SchemaName: schema,
  RequiredLevel: reqLevel(),
  MaxLength: max,
  Format: 'Text',
  DisplayName: label(display),
});
const dateAttr = (schema: string, display: string): AttrDef => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
  SchemaName: schema,
  RequiredLevel: reqLevel(),
  Format: 'DateOnly',
  DateTimeBehavior: { Value: 'DateOnly' },
  DisplayName: label(display),
});
const intAttr = (schema: string, display: string): AttrDef => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
  SchemaName: schema,
  RequiredLevel: reqLevel(),
  MinValue: 0,
  MaxValue: 100,
  DisplayName: label(display),
});
const boolAttr = (schema: string, display: string): AttrDef => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata',
  SchemaName: schema,
  RequiredLevel: reqLevel(),
  DisplayName: label(display),
  OptionSet: {
    '@odata.type': 'Microsoft.Dynamics.CRM.BooleanOptionSetMetadata',
    TrueOption: { Value: 1, Label: label('Yes') },
    FalseOption: { Value: 0, Label: label('No') },
  },
});

interface TableDef {
  schema: string;
  logical: string;
  entitySet: string;
  display: string;
  displayPlural: string;
  primary: AttrDef;
  columns: AttrDef[];
}

const TABLES: TableDef[] = [
  {
    schema: 'fastpass_Employee',
    logical: 'fastpass_employee',
    entitySet: 'fastpass_employees',
    display: 'Employee',
    displayPlural: 'Employees',
    primary: strAttr('fastpass_EmployeeCode', 'Employee Code', { max: 100, primary: true }),
    columns: [
      strAttr('fastpass_FullName', 'Full Name'),
      strAttr('fastpass_Role', 'Role'),
      strAttr('fastpass_Department', 'Department'),
      strAttr('fastpass_Team', 'Team'),
      strAttr('fastpass_ManagerName', 'Manager Name'),
      strAttr('fastpass_JourneyStatus', 'Journey Status', { max: 50 }),
      intAttr('fastpass_ProgressPercentage', 'Progress Percentage'),
      strAttr('fastpass_CurrentMilestone', 'Current Milestone'),
      dateAttr('fastpass_StartDate', 'Start Date'),
      dateAttr('fastpass_LastActivityDate', 'Last Activity Date'),
      strAttr('fastpass_UserPrincipalName', 'User Principal Name', { max: 200 }),
    ],
  },
  {
    schema: 'fastpass_EmployeeTask',
    logical: 'fastpass_employeetask',
    entitySet: 'fastpass_employeetasks',
    display: 'Employee Task',
    displayPlural: 'Employee Tasks',
    primary: strAttr('fastpass_TaskName', 'Task Name', { max: 200, primary: true }),
    columns: [
      memoAttr('fastpass_Description', 'Description'),
      strAttr('fastpass_Status', 'Status', { max: 50 }),
      dateAttr('fastpass_DueDate', 'Due Date'),
      dateAttr('fastpass_CompletedDate', 'Completed Date'),
      boolAttr('fastpass_BlockerFlag', 'Blocker Flag'),
      memoAttr('fastpass_BlockerDescription', 'Blocker Description'),
      boolAttr('fastpass_Required', 'Required'),
      strAttr('fastpass_Category', 'Category'),
      strAttr('fastpass_RecommendedResourceId', 'Recommended Resource Id', { max: 100 }),
      memoAttr('fastpass_Notes', 'Notes'),
    ],
  },
  {
    schema: 'fastpass_Milestone',
    logical: 'fastpass_milestone',
    entitySet: 'fastpass_milestones',
    display: 'Milestone',
    displayPlural: 'Milestones',
    primary: strAttr('fastpass_MilestoneName', 'Milestone Name', { max: 200, primary: true }),
    columns: [
      strAttr('fastpass_MilestoneCode', 'Milestone Code', { max: 100 }),
      memoAttr('fastpass_Description', 'Description'),
      memoAttr('fastpass_TaskNames', 'Task Names'),
    ],
  },
  {
    schema: 'fastpass_Resource',
    logical: 'fastpass_resource',
    entitySet: 'fastpass_resources',
    display: 'Resource',
    displayPlural: 'Resources',
    primary: strAttr('fastpass_ResourceName', 'Resource Name', { max: 200, primary: true }),
    columns: [
      strAttr('fastpass_ResourceCode', 'Resource Code', { max: 100 }),
      memoAttr('fastpass_Description', 'Description'),
      strAttr('fastpass_Type', 'Type', { max: 50 }),
      strAttr('fastpass_Url', 'Url', { max: 500 }),
      memoAttr('fastpass_RelatedTaskNames', 'Related Task Names'),
    ],
  },
];

const LOOKUP = {
  relationshipSchema: 'fastpass_Employee_fastpass_EmployeeTask',
  referenced: 'fastpass_employee',
  referencing: 'fastpass_employeetask',
  lookupSchema: 'fastpass_Employee',
};

/* -------------------------------------------------------------------------- */
/* schema provisioning                                                         */
/* -------------------------------------------------------------------------- */

async function entityExists(logical: string): Promise<boolean> {
  const r = await wa('GET', `EntityDefinitions(LogicalName='${logical}')?$select=LogicalName`);
  return r.status === 200;
}
async function attributeExists(entityLogical: string, attrLogical: string): Promise<boolean> {
  const r = await wa(
    'GET',
    `EntityDefinitions(LogicalName='${entityLogical}')/Attributes(LogicalName='${attrLogical}')?$select=LogicalName`,
  );
  return r.status === 200;
}
const attrLogical = (def: AttrDef) => String(def.SchemaName).toLowerCase();

async function ensureSchema() {
  for (const t of TABLES) {
    if (await entityExists(t.logical)) {
      console.log(`· table ${t.logical} exists`);
    } else {
      console.log(`+ creating table ${t.logical}`);
      await waOk('POST', 'EntityDefinitions', {
        '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
        SchemaName: t.schema,
        DisplayName: label(t.display),
        DisplayCollectionName: label(t.displayPlural),
        Description: label(`FastPass ${t.display}`),
        OwnershipType: 'UserOwned',
        IsActivity: false,
        HasActivities: false,
        HasNotes: false,
        EntitySetName: t.entitySet,
        Attributes: [t.primary],
      });
    }

    for (const col of t.columns) {
      if (await attributeExists(t.logical, attrLogical(col))) {
        console.log(`  · ${t.logical}.${attrLogical(col)} exists`);
        continue;
      }
      console.log(`  + ${t.logical}.${attrLogical(col)}`);
      await waOk('POST', `EntityDefinitions(LogicalName='${t.logical}')/Attributes`, col);
    }
  }

  // Employee -> Employee Task lookup
  if (await attributeExists(LOOKUP.referencing, LOOKUP.lookupSchema.toLowerCase())) {
    console.log(`· lookup ${LOOKUP.referencing}.${LOOKUP.lookupSchema.toLowerCase()} exists`);
  } else {
    console.log(`+ creating lookup ${LOOKUP.lookupSchema}`);
    await waOk('POST', 'RelationshipDefinitions', {
      '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
      SchemaName: LOOKUP.relationshipSchema,
      ReferencedEntity: LOOKUP.referenced,
      ReferencingEntity: LOOKUP.referencing,
      Lookup: {
        '@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
        SchemaName: LOOKUP.lookupSchema,
        RequiredLevel: reqLevel(),
        DisplayName: label('Employee'),
      },
    });
  }

  console.log('publishing customizations…');
  await waOk('POST', 'PublishAllXml', {});
  await sleep(4000);
}

async function employeeNavProp(): Promise<string> {
  const r = await waOk(
    'GET',
    `RelationshipDefinitions/Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata(SchemaName='${LOOKUP.relationshipSchema}')?$select=ReferencingEntityNavigationPropertyName`,
  );
  return (r.json as { ReferencingEntityNavigationPropertyName: string })
    .ReferencingEntityNavigationPropertyName;
}

/* -------------------------------------------------------------------------- */
/* data                                                                        */
/* -------------------------------------------------------------------------- */

const dateOnly = (iso: string | null): string | undefined => (iso ? iso.slice(0, 10) : undefined);

function createdId(headers: Headers): string {
  const loc = headers.get('OData-EntityId') ?? '';
  const m = loc.match(/\(([0-9a-fA-F-]{36})\)/);
  if (!m?.[1]) throw new Error(`no id in OData-EntityId: ${loc}`);
  return m[1];
}

async function whoAmIUpn(): Promise<string | undefined> {
  const who = await waOk('GET', 'WhoAmI');
  const userId = (who.json as { UserId: string }).UserId;
  const u = await waOk('GET', `systemusers(${userId})?$select=domainname,internalemailaddress`);
  const j = u.json as { domainname?: string; internalemailaddress?: string };
  return j.domainname || j.internalemailaddress;
}

async function wipeTable(set: string) {
  const r = await waOk('GET', `${set}?$select=${set.slice(0, -1)}id`);
  const rows = (r.json as { value: Record<string, string>[] }).value;
  for (const row of rows) {
    const id = row[`${set.slice(0, -1)}id`];
    await waOk('DELETE', `${set}(${id})`);
  }
  if (rows.length) console.log(`  wiped ${rows.length} from ${set}`);
}

async function loadData() {
  const meUpn = ME_UPN ?? (await whoAmIUpn());
  if (meUpn) console.log(`Cesar Martinez row keyed to: ${meUpn}`);
  else console.log('! could not resolve your UPN — Cesar row will have a blank UPN');

  const navProp = await employeeNavProp();

  if (WIPE) {
    console.log('wiping existing rows…');
    await wipeTable('fastpass_employeetasks');
    await wipeTable('fastpass_employees');
    await wipeTable('fastpass_milestones');
    await wipeTable('fastpass_resources');
  }

  // employees
  const team = cloneTeamMembers();
  const employees: { emp: Employee; upn: string; tasks: EmployeeTask[] }[] = [
    { emp: MOCK_EMPLOYEE, upn: meUpn ?? '', tasks: MOCK_TASKS },
    ...team.map((m) => ({ emp: m.employee, upn: '', tasks: m.tasks })),
  ];

  const codeToId = new Map<string, string>();
  for (const { emp, upn } of employees) {
    const r = await waOk('POST', 'fastpass_employees', {
      fastpass_employeecode: emp.employeeId,
      fastpass_fullname: emp.displayName,
      fastpass_role: emp.role,
      fastpass_department: emp.department,
      fastpass_team: emp.team,
      fastpass_managername: emp.managerName,
      fastpass_journeystatus: emp.journeyStatus,
      fastpass_progresspercentage: emp.progressPercentage,
      fastpass_currentmilestone: emp.currentMilestone,
      fastpass_startdate: dateOnly(emp.startDate),
      fastpass_lastactivitydate: dateOnly(emp.lastActivityDate),
      fastpass_userprincipalname: upn,
    });
    codeToId.set(emp.employeeId, createdId(r.headers));
    console.log(`+ employee ${emp.displayName} (${emp.employeeId})`);
  }

  // tasks
  let taskCount = 0;
  for (const { emp, tasks } of employees) {
    const empId = codeToId.get(emp.employeeId)!;
    for (const task of tasks) {
      await waOk('POST', 'fastpass_employeetasks', {
        fastpass_taskname: task.name,
        [`${navProp}@odata.bind`]: `/fastpass_employees(${empId})`,
        fastpass_description: task.description,
        fastpass_status: task.status,
        fastpass_duedate: dateOnly(task.dueDate),
        fastpass_completeddate: dateOnly(task.completedDate),
        fastpass_blockerflag: task.blockerFlag,
        fastpass_blockerdescription: task.blockerDescription ?? undefined,
        fastpass_required: task.required,
        fastpass_category: task.category,
        fastpass_recommendedresourceid: task.recommendedResourceId ?? undefined,
        fastpass_notes: task.notes ?? undefined,
      });
      taskCount++;
    }
  }
  console.log(`+ ${taskCount} employee tasks`);

  // milestones
  for (const m of MOCK_MILESTONES) {
    await waOk('POST', 'fastpass_milestones', {
      fastpass_milestonename: m.name,
      fastpass_milestonecode: m.id,
      fastpass_description: m.description,
      fastpass_tasknames: m.taskNames.join('\n'),
    });
  }
  console.log(`+ ${MOCK_MILESTONES.length} milestones`);

  // resources
  for (const res of MOCK_RESOURCES) {
    await waOk('POST', 'fastpass_resources', {
      fastpass_resourcename: res.name,
      fastpass_resourcecode: res.id,
      fastpass_description: res.description,
      fastpass_type: res.type,
      fastpass_url: res.url,
      fastpass_relatedtasknames: res.relatedTaskNames.join('\n'),
    });
  }
  console.log(`+ ${MOCK_RESOURCES.length} resources`);
}

/* -------------------------------------------------------------------------- */
/* main                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log(`FastPass → ${ORG_URL}\n`);
  TOKEN = await getToken();
  await waOk('GET', 'WhoAmI'); // fail fast if the token can't hit Dataverse

  if (!DATA_ONLY) await ensureSchema();
  if (!SCHEMA_ONLY) await loadData();

  console.log('\nDone. Set VITE_FASTPASS_DATA_SOURCE=dataverse and run the app.');
}

main().catch((err) => {
  console.error(`\nFAILED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
