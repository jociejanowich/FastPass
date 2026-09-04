/**
 * Dataverse adapter, built against the real Power Apps Code Apps client SDK
 * (`@microsoft/power-apps`, https://www.npmjs.com/package/@microsoft/power-apps).
 *
 * This is genuine integration code, not a stub — `getContext()` (from
 * `@microsoft/power-apps/app`) and `getClient()` (from
 * `@microsoft/power-apps/data`) are the SDK's actual exported APIs. What it
 * cannot do
 * from this repository is supply `dataSourcesInfo`: that value is generated
 * into the project by running `pac code add-data-source` against a real,
 * signed-in-to Power Platform environment (see the README's "Connecting to
 * a real Dataverse environment" section), which requires the user's own
 * tenant and credentials. Everything downstream of that one hand-off point
 * is implemented here for real.
 *
 * Table/column names and the row -> domain mapping live in dataverseSchema.ts.
 */

import { getContext } from '@microsoft/power-apps/app';
import { getClient } from '@microsoft/power-apps/data';
import type { DataClient } from '@microsoft/power-apps/data';

/**
 * `DataSourcesInfo` (the config object `pac code add-data-source` generates)
 * is not part of this package's public type exports in 1.3.1 — it only
 * exists under an internal subpath. Deriving it from `getClient`'s own
 * parameter type keeps this file exact against whatever version is
 * installed without importing an `internal/*` module.
 */
type DataSourcesInfo = Parameters<typeof getClient>[0];

import { applySignalsToTasks } from '../domain/detection';
import { selectManagerSummary } from '../domain/selectors';
import type { SignalReading } from '../domain/signals';
import type {
  Employee,
  EmployeeTask,
  ManagerSummary,
  Milestone,
  Resource,
  TaskStatus,
  TeamOnboarding,
} from '../domain/types';
import type { FastPassDataSnapshot, FastPassRepository } from './FastPassRepository';
import {
  DATAVERSE_TABLES,
  type DataverseEmployeeRow,
  type DataverseEmployeeTaskRow,
  type DataverseMilestoneRow,
  type DataverseResourceRow,
  odataString,
  toEmployee,
  toEmployeeTask,
  toMilestone,
  toResource,
} from './dataverseSchema';

export class DataverseFastPassRepository implements FastPassRepository {
  private readonly client: DataClient;
  private currentEmployeeId: string | null = null;

  constructor(dataSourcesInfo: DataSourcesInfo) {
    this.client = getClient(dataSourcesInfo);
  }

  async getCurrentEmployee(): Promise<Employee> {
    const context = await getContext();
    const upn = context.user.userPrincipalName;
    if (!upn) {
      throw new Error(
        'getContext() returned no userPrincipalName; cannot resolve the signed-in employee.',
      );
    }
    const result = await this.client.retrieveMultipleRecordsAsync<DataverseEmployeeRow>(
      DATAVERSE_TABLES.employee,
      { filter: `fastpass_userprincipalname eq '${odataString(upn)}'`, top: 1 },
    );
    if (!result.success) {
      throw toError(result.error, 'getCurrentEmployee');
    }
    const row = result.data[0];
    if (!row) {
      throw new Error(`No fastpass_employees row found for userPrincipalName "${upn}".`);
    }
    this.currentEmployeeId = row.fastpass_employeeid;
    return toEmployee(row);
  }

  async getEmployeeTasks(employeeId: string): Promise<EmployeeTask[]> {
    const result = await this.client.retrieveMultipleRecordsAsync<DataverseEmployeeTaskRow>(
      DATAVERSE_TABLES.employeeTask,
      { filter: `_fastpass_employee_value eq '${odataString(employeeId)}'` },
    );
    if (!result.success) {
      throw toError(result.error, 'getEmployeeTasks');
    }
    return result.data.map(toEmployeeTask);
  }

  async getMilestones(): Promise<Milestone[]> {
    const result = await this.client.retrieveMultipleRecordsAsync<DataverseMilestoneRow>(
      DATAVERSE_TABLES.milestone,
    );
    if (!result.success) {
      throw toError(result.error, 'getMilestones');
    }
    return result.data.map(toMilestone);
  }

  async getResources(): Promise<Resource[]> {
    const result = await this.client.retrieveMultipleRecordsAsync<DataverseResourceRow>(
      DATAVERSE_TABLES.resource,
    );
    if (!result.success) {
      throw toError(result.error, 'getResources');
    }
    return result.data.map(toResource);
  }

  async getSignals(_employeeId: string): Promise<SignalReading[]> {
    // Signals come from connected systems (Microsoft Graph, Intune, the LMS,
    // the ITSM tool) rather than Dataverse. Each of those is a separate
    // adapter with its own auth/connector, out of scope for this repository;
    // until one is wired in, tasks fall back to their stored fastpass_status.
    return [];
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<EmployeeTask> {
    const changes: Partial<DataverseEmployeeTaskRow> = {
      fastpass_status: status,
      fastpass_completeddate: status === 'Completed' ? new Date().toISOString() : null,
      fastpass_blockerflag: status === 'Blocked',
      fastpass_blockerdescription: status === 'Blocked' ? undefined : null,
    };
    const result = await this.client.updateRecordAsync<
      Partial<DataverseEmployeeTaskRow>,
      DataverseEmployeeTaskRow
    >(DATAVERSE_TABLES.employeeTask, taskId, changes);
    if (!result.success) {
      throw toError(result.error, 'updateTaskStatus');
    }
    return this.retrieveTask(taskId);
  }

  async updateTaskBlocker(
    taskId: string,
    blockerFlag: boolean,
    description: string | null,
  ): Promise<EmployeeTask> {
    const changes: Partial<DataverseEmployeeTaskRow> = {
      fastpass_blockerflag: blockerFlag,
      fastpass_blockerdescription: blockerFlag ? description : null,
      fastpass_status: blockerFlag ? 'Blocked' : 'In Progress',
    };
    const result = await this.client.updateRecordAsync<
      Partial<DataverseEmployeeTaskRow>,
      DataverseEmployeeTaskRow
    >(DATAVERSE_TABLES.employeeTask, taskId, changes);
    if (!result.success) {
      throw toError(result.error, 'updateTaskBlocker');
    }
    return this.retrieveTask(taskId);
  }

  async getManagerSummary(employeeId: string): Promise<ManagerSummary> {
    const [employee, tasks, milestones, resources] = await Promise.all([
      this.retrieveEmployee(employeeId),
      this.getEmployeeTasks(employeeId),
      this.getMilestones(),
      this.getResources(),
    ]);
    return selectManagerSummary(employee, tasks, milestones, resources, new Date().toISOString());
  }

  async getTeamOnboarding(managerName: string): Promise<TeamOnboarding> {
    const result = await this.client.retrieveMultipleRecordsAsync<DataverseEmployeeRow>(
      DATAVERSE_TABLES.employee,
      { filter: `fastpass_managername eq '${odataString(managerName)}'` },
    );
    if (!result.success) {
      throw toError(result.error, 'getTeamOnboarding');
    }
    const members = await Promise.all(
      result.data.map(async (row) => {
        const employee = toEmployee(row);
        const tasks = await this.getEmployeeTasks(employee.id);
        return { employee, tasks };
      }),
    );
    return { managerName, members };
  }

  async refresh(): Promise<FastPassDataSnapshot> {
    const employee = await this.getCurrentEmployee();
    const [tasks, milestones, resources, signals] = await Promise.all([
      this.getEmployeeTasks(employee.id),
      this.getMilestones(),
      this.getResources(),
      this.getSignals(employee.id),
    ]);
    return { employee, tasks: applySignalsToTasks(tasks, signals), milestones, resources, signals };
  }

  private async retrieveEmployee(employeeId: string): Promise<Employee> {
    if (employeeId === this.currentEmployeeId) {
      return this.getCurrentEmployee();
    }
    const result = await this.client.retrieveRecordAsync<DataverseEmployeeRow>(
      DATAVERSE_TABLES.employee,
      employeeId,
    );
    if (!result.success) {
      throw toError(result.error, 'retrieveEmployee');
    }
    return toEmployee(result.data);
  }

  private async retrieveTask(taskId: string): Promise<EmployeeTask> {
    const result = await this.client.retrieveRecordAsync<DataverseEmployeeTaskRow>(
      DATAVERSE_TABLES.employeeTask,
      taskId,
    );
    if (!result.success) {
      throw toError(result.error, 'retrieveTask');
    }
    return toEmployeeTask(result.data);
  }
}

/**
 * `IOperationResult.error` is typed `Error | PowerDataRuntimeHttpError`;
 * the latter is a plain `{ message, status?, requestId?, stack? }` shape,
 * not an `Error` subclass, so both are normalized here.
 */
function toError(error: Error | { message: string } | undefined, context: string): Error {
  if (error instanceof Error) return error;
  if (error) return new Error(`${error.message} (DataverseFastPassRepository.${context})`);
  return new Error(`Dataverse operation failed in DataverseFastPassRepository.${context}`);
}
