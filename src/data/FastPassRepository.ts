/**
 * Data-service contract for FastPass.
 *
 * Pages and state never import a concrete repository — they depend on this
 * interface. Swapping MockFastPassRepository for DataverseFastPassRepository
 * must not require any change to presentation code.
 */

import type { SignalReading, SignalStatus } from '../domain/signals';
import type {
  Employee,
  EmployeeTask,
  ManagerSummary,
  Milestone,
  Resource,
  TaskStatus,
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
  /** Re-reads connected systems and returns a fresh, signal-derived snapshot. */
  refresh(): Promise<FastPassDataSnapshot>;
  /**
   * Demo-only: simulate a connected system reporting a new state for one
   * signal, then re-derive tasks. Optional for real adapters.
   */
  simulateSignal?(
    signalKey: string,
    status: SignalStatus,
    detail?: string,
  ): Promise<FastPassDataSnapshot>;
  /** Demo-only: restore the initial demo state. Optional for real adapters. */
  resetDemo?(): Promise<FastPassDataSnapshot>;
}
