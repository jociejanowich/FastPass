/**
 * Data-service contract for FastPass.
 *
 * Pages and state never import a concrete repository — they depend on this
 * interface. Swapping MockFastPassRepository for DataverseFastPassRepository
 * must not require any change to presentation code.
 */

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

export interface FastPassDataSnapshot {
  employee: Employee;
  tasks: EmployeeTask[];
  milestones: Milestone[];
  resources: Resource[];
  /** Latest readings from connected systems; task status is derived from these. */
  signals: SignalReading[];
}

export interface FastPassRepository {
  getCurrentEmployee(): Promise<Employee>;
  getEmployeeTasks(employeeId: string): Promise<EmployeeTask[]>;
  getMilestones(): Promise<Milestone[]>;
  getResources(): Promise<Resource[]>;
  getSignals(employeeId: string): Promise<SignalReading[]>;
  /**
   * Manual status update. Only valid for tasks with no detection rule; the mock
   * rejects updates to auto-detected tasks.
   */
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<EmployeeTask>;
  updateTaskBlocker(
    taskId: string,
    blockerFlag: boolean,
    description: string | null,
  ): Promise<EmployeeTask>;
  getManagerSummary(employeeId: string): Promise<ManagerSummary>;
  /**
   * Every direct report's onboarding data for a manager. In production this is
   * scoped by the signed-in manager's identity (Graph `/me/directReports`).
   */
  getTeamOnboarding(managerName: string): Promise<TeamOnboarding>;
  /** Re-reads connected systems and returns a fresh, signal-derived snapshot. */
  refresh(): Promise<FastPassDataSnapshot>;
  /**
   * Ingest a signal event from a connected system (webhook or poll result),
   * then re-derive tasks. Optional for adapters that only pull on refresh.
   */
  ingestSignal?(reading: SignalReading): Promise<FastPassDataSnapshot>;
  /** Restore the seed state. Optional; used for local development. */
  resetDemo?(): Promise<FastPassDataSnapshot>;
}
