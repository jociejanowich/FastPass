/**
 * Dataverse table/column mapping for FastPass.
 *
 * This is the schema `DataverseFastPassRepository` assumes. It is NOT
 * auto-created: build these four tables in the target Power Platform
 * environment (Solution Explorer, or `pac data-model` tooling) before
 * `pac code add-data-source` is run against them — see the "Connecting to a
 * real Dataverse environment" section of the README.
 *
 * Design choices, and why:
 *  - Status/type/journey-status columns are modeled as plain single-line-text
 *    columns holding the same string literals used in domain/types.ts
 *    (`"Not Started"`, `"Blocked"`, ...), not Dataverse Choice columns. Choice
 *    columns store an arbitrary numeric option-set value chosen when the
 *    column is created, which this codebase has no way to know in advance;
 *    text columns keep the wire format identical to the domain type and
 *    avoid a hand-maintained numeric mapping that would silently drift from
 *    whatever the environment's solution actually defines. Swap to Choice
 *    columns later if the option-set values are pinned in source control.
 *  - `taskNames` / `relatedTaskNames` (string[] in the domain model) are
 *    stored as a single multi-line-text column, one name per line, because
 *    Dataverse has no native array/list column type.
 *  - Every row keeps a GUID primary key (Dataverse requires one); the
 *    domain `id` field is that GUID as a string.
 *  - `fastpass_userprincipalname` on the employee table is how
 *    `getCurrentEmployee()` maps the signed-in user (from
 *    `app.getContext()`) onto a Dataverse row — set it from Entra ID when
 *    each employee record is created.
 *
 * Dataverse's Web API represents a single-valued lookup column as
 * `_<columnname>_value` in JSON responses (e.g. `_fastpass_employee_value`),
 * never as the plain column name. That convention is reflected below.
 */

import type {
  Employee,
  EmployeeTask,
  JourneyStatus,
  Milestone,
  MilestoneId,
  Resource,
  ResourceType,
  TaskStatus,
} from '../domain/types';

/**
 * Table (data source) names as passed to `DataClient` methods. These must
 * match whatever `pac code add-data-source` registered for each table in
 * `power.config.json` — adjust if the generated name differs (it is
 * typically the table's plural logical name).
 */
export const DATAVERSE_TABLES = {
  employee: 'fastpass_employees',
  employeeTask: 'fastpass_employeetasks',
  milestone: 'fastpass_milestones',
  resource: 'fastpass_resources',
} as const;

export interface DataverseEmployeeRow {
  fastpass_employeeid: string;
  fastpass_employeecode: string;
  fastpass_displayname: string;
  fastpass_role: string;
  fastpass_department: string;
  fastpass_team: string;
  fastpass_managername: string;
  fastpass_journeystatus: JourneyStatus;
  fastpass_progresspercentage: number;
  fastpass_currentmilestone: string;
  fastpass_startdate: string;
  fastpass_lastactivitydate: string;
  fastpass_userprincipalname: string;
}

export interface DataverseEmployeeTaskRow {
  fastpass_employeetaskid: string;
  _fastpass_employee_value: string;
  fastpass_name: string;
  fastpass_description: string;
  fastpass_status: TaskStatus;
  fastpass_duedate: string | null;
  fastpass_completeddate: string | null;
  fastpass_blockerflag: boolean;
  fastpass_blockerdescription: string | null;
  fastpass_required: boolean;
  fastpass_category: string;
  fastpass_recommendedresourceid: string | null;
  fastpass_notes: string | null;
}

export interface DataverseMilestoneRow {
  fastpass_milestoneid: string;
  fastpass_name: string;
  fastpass_description: string;
  /** One task name per line. */
  fastpass_tasknames: string;
}

export interface DataverseResourceRow {
  fastpass_resourceid: string;
  fastpass_name: string;
  fastpass_description: string;
  fastpass_type: ResourceType;
  fastpass_url: string;
  /** One task name per line. */
  fastpass_relatedtasknames: string;
}

export function toEmployee(row: DataverseEmployeeRow): Employee {
  return {
    id: row.fastpass_employeeid,
    employeeId: row.fastpass_employeecode,
    displayName: row.fastpass_displayname,
    role: row.fastpass_role,
    department: row.fastpass_department,
    team: row.fastpass_team,
    managerName: row.fastpass_managername,
    journeyStatus: row.fastpass_journeystatus,
    progressPercentage: row.fastpass_progresspercentage,
    currentMilestone: row.fastpass_currentmilestone,
    startDate: row.fastpass_startdate,
    lastActivityDate: row.fastpass_lastactivitydate,
  };
}

export function toEmployeeTask(row: DataverseEmployeeTaskRow): EmployeeTask {
  return {
    id: row.fastpass_employeetaskid,
    employeeId: row._fastpass_employee_value,
    name: row.fastpass_name,
    description: row.fastpass_description,
    status: row.fastpass_status,
    dueDate: row.fastpass_duedate,
    completedDate: row.fastpass_completeddate,
    blockerFlag: row.fastpass_blockerflag,
    blockerDescription: row.fastpass_blockerdescription,
    required: row.fastpass_required,
    category: row.fastpass_category,
    recommendedResourceId: row.fastpass_recommendedresourceid,
    notes: row.fastpass_notes,
  };
}

export function toMilestone(row: DataverseMilestoneRow): Milestone {
  return {
    id: row.fastpass_milestoneid as MilestoneId,
    name: row.fastpass_name,
    description: row.fastpass_description,
    taskNames: splitLines(row.fastpass_tasknames),
  };
}

export function toResource(row: DataverseResourceRow): Resource {
  return {
    id: row.fastpass_resourceid,
    name: row.fastpass_name,
    description: row.fastpass_description,
    type: row.fastpass_type,
    url: row.fastpass_url,
    relatedTaskNames: splitLines(row.fastpass_relatedtasknames),
  };
}

function splitLines(value: string | null | undefined): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Escapes a value for use inside a single-quoted OData string literal
 * (Dataverse's `$filter` convention: a literal `'` is written as `''`).
 */
export function odataString(value: string): string {
  return value.replace(/'/g, "''");
}
