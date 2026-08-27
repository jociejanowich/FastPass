/**
 * Placeholder Dataverse adapter.
 *
 * This class documents exactly where a real Microsoft Dataverse integration
 * plugs in. It implements the same FastPassRepository contract as the mock, so
 * switching the app over is a one-line change in the repository factory
 * (see data/repositoryFactory.ts) plus environment configuration.
 *
 * Implementation notes for whoever wires this up:
 *  - Acquire a token with MSAL (or the Power Platform connector) for the
 *    Dataverse Web API scope: `${environmentUrl}/.default`.
 *  - Tables (suggested logical names):
 *      fastpass_employee, fastpass_employeetask, fastpass_milestone,
 *      fastpass_resource
 *  - Map each row onto the domain types in domain/types.ts. Do NOT leak
 *    Dataverse GUIDs or OData annotations into the domain objects; translate
 *    option sets (statuscode) into the string unions used by the app.
 *  - updateTaskStatus / updateTaskBlocker => PATCH the task row.
 *  - getManagerSummary can be computed client-side with selectManagerSummary,
 *    or delegated to a custom API / Power Automate flow.
 */

import type {
  Employee,
  EmployeeTask,
  ManagerSummary,
  Milestone,
  Resource,
  TaskStatus,
} from '../domain/types';
import type { FastPassDataSnapshot, FastPassRepository } from './FastPassRepository';

export interface DataverseConfig {
  environmentUrl: string;
  clientId: string;
  tenantId: string;
}

const NOT_IMPLEMENTED =
  'DataverseFastPassRepository is a placeholder. Configure VITE_FASTPASS_DATA_SOURCE=dataverse and implement this adapter to use a live environment.';

export class DataverseFastPassRepository implements FastPassRepository {
  constructor(private readonly config: DataverseConfig) {}

  private get baseUrl(): string {
    return `${this.config.environmentUrl.replace(/\/$/, '')}/api/data/v9.2`;
  }

  async getCurrentEmployee(): Promise<Employee> {
    throw new Error(`${NOT_IMPLEMENTED} (getCurrentEmployee via ${this.baseUrl})`);
  }

  async getEmployeeTasks(_employeeId: string): Promise<EmployeeTask[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getMilestones(): Promise<Milestone[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getResources(): Promise<Resource[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateTaskStatus(_taskId: string, _status: TaskStatus): Promise<EmployeeTask> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateTaskBlocker(
    _taskId: string,
    _blockerFlag: boolean,
    _description: string | null,
  ): Promise<EmployeeTask> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getManagerSummary(_employeeId: string): Promise<ManagerSummary> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async refresh(): Promise<FastPassDataSnapshot> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
