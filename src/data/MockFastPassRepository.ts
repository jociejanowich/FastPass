/**
 * In-memory implementation of FastPassRepository backed by the demo data set.
 *
 * Task status is DERIVED from connected-system signals, not stored by hand.
 * The repository holds the latest signal readings and re-applies them to a
 * pristine copy of the task list on every read and on every change. `resetDemo`
 * restores the original signals. Contains no React and no domain rules beyond
 * the signal → task mapping in `applySignalsToTasks`.
 */

import { DEMO_EMPLOYEE_ID, MOCK_LATENCY_MS, demoDateOffset } from '../config/demoConfig';
import { applySignalsToTasks, getDetectionRule } from '../domain/detection';
import { selectManagerSummary } from '../domain/selectors';
import type { SignalReading } from '../domain/signals';
import type {
  Employee,
  EmployeeTask,
  ManagerSummary,
  Milestone,
  Resource,
  TaskStatus,
} from '../domain/types';
import type { FastPassDataSnapshot, FastPassRepository } from './FastPassRepository';
import { MOCK_MILESTONES, MOCK_RESOURCES, cloneMockEmployee, cloneMockTasks } from './mockData';
import { cloneMockSignals } from './mockSignals';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockFastPassRepository implements FastPassRepository {
  private employee: Employee;
  private signals: SignalReading[];
  private tasks: EmployeeTask[];
  private readonly milestones: Milestone[];
  private readonly resources: Resource[];

  constructor(private readonly latencyMs: number = MOCK_LATENCY_MS) {
    this.employee = cloneMockEmployee();
    this.signals = cloneMockSignals();
    this.tasks = applySignalsToTasks(cloneMockTasks(), this.signals);
    this.milestones = MOCK_MILESTONES.map((milestone) => ({
      ...milestone,
      taskNames: [...milestone.taskNames],
    }));
    this.resources = MOCK_RESOURCES.map((resource) => ({
      ...resource,
      relatedTaskNames: [...resource.relatedTaskNames],
    }));
  }

  async getCurrentEmployee(): Promise<Employee> {
    await delay(this.latencyMs);
    return { ...this.employee };
  }

  async getEmployeeTasks(employeeId: string): Promise<EmployeeTask[]> {
    await delay(this.latencyMs);
    return this.tasks.filter((task) => task.employeeId === employeeId).map((task) => ({ ...task }));
  }

  async getMilestones(): Promise<Milestone[]> {
    await delay(this.latencyMs);
    return this.milestones.map((milestone) => ({
      ...milestone,
      taskNames: [...milestone.taskNames],
    }));
  }

  async getResources(): Promise<Resource[]> {
    await delay(this.latencyMs);
    return this.resources.map((resource) => ({
      ...resource,
      relatedTaskNames: [...resource.relatedTaskNames],
    }));
  }

  async getSignals(): Promise<SignalReading[]> {
    await delay(this.latencyMs);
    return this.signals.map((signal) => ({ ...signal }));
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<EmployeeTask> {
    await delay(this.latencyMs);
    const task = this.requireTask(taskId);
    if (getDetectionRule(task.name)) {
      throw new Error(
        `"${task.name}" is detected automatically from a connected system and cannot be set by hand.`,
      );
    }
    task.status = status;
    task.completedDate = status === 'Completed' ? (task.completedDate ?? demoDateOffset(0)) : null;
    task.blockerFlag = status === 'Blocked';
    task.blockerDescription =
      status === 'Blocked'
        ? (task.blockerDescription ?? 'Marked blocked. Add a description of what is needed.')
        : null;
    this.touchActivity();
    return { ...task };
  }

  async updateTaskBlocker(
    taskId: string,
    blockerFlag: boolean,
    description: string | null,
  ): Promise<EmployeeTask> {
    await delay(this.latencyMs);
    const task = this.requireTask(taskId);
    if (getDetectionRule(task.name)) {
      throw new Error(
        `"${task.name}" is detected automatically from a connected system and cannot be set by hand.`,
      );
    }
    task.blockerFlag = blockerFlag;
    task.blockerDescription = blockerFlag
      ? (description ?? task.blockerDescription ?? 'Blocked and awaiting action.')
      : null;
    task.status = blockerFlag ? 'Blocked' : task.status === 'Blocked' ? 'In Progress' : task.status;
    if (task.status !== 'Completed') task.completedDate = null;
    this.touchActivity();
    return { ...task };
  }

  async getManagerSummary(employeeId: string): Promise<ManagerSummary> {
    await delay(this.latencyMs);
    const tasks = this.tasks.filter((task) => task.employeeId === employeeId);
    return selectManagerSummary(
      this.employee,
      tasks,
      this.milestones,
      this.resources,
      demoDateOffset(0),
    );
  }

  async refresh(): Promise<FastPassDataSnapshot> {
    await delay(this.latencyMs);
    // A real adapter would re-poll each connected system here.
    this.tasks = applySignalsToTasks(cloneMockTasks(), this.signals);
    return this.snapshot();
  }

  async ingestSignal(reading: SignalReading): Promise<FastPassDataSnapshot> {
    await delay(this.latencyMs);
    const index = this.signals.findIndex((candidate) => candidate.key === reading.key);
    if (index >= 0) {
      this.signals[index] = { ...reading };
    } else {
      this.signals.push({ ...reading });
    }
    this.tasks = applySignalsToTasks(cloneMockTasks(), this.signals);
    this.touchActivity();
    return this.snapshot();
  }

  async resetDemo(): Promise<FastPassDataSnapshot> {
    await delay(this.latencyMs);
    this.employee = cloneMockEmployee();
    this.signals = cloneMockSignals();
    this.tasks = applySignalsToTasks(cloneMockTasks(), this.signals);
    return this.snapshot();
  }

  private snapshot(): FastPassDataSnapshot {
    return {
      employee: { ...this.employee },
      tasks: this.tasks.map((task) => ({ ...task })),
      milestones: this.milestones.map((milestone) => ({
        ...milestone,
        taskNames: [...milestone.taskNames],
      })),
      resources: this.resources.map((resource) => ({
        ...resource,
        relatedTaskNames: [...resource.relatedTaskNames],
      })),
      signals: this.signals.map((signal) => ({ ...signal })),
    };
  }

  private requireTask(taskId: string): EmployeeTask {
    const task = this.tasks.find((candidate) => candidate.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  private touchActivity(): void {
    this.employee.lastActivityDate = demoDateOffset(0);
  }
}

export function createMockRepository(): FastPassRepository {
  return new MockFastPassRepository();
}

export { DEMO_EMPLOYEE_ID };
