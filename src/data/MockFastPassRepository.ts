/**
 * In-memory implementation of FastPassRepository backed by the demo data set.
 *
 * State mutates in memory for the lifetime of the page session. `resetDemo`
 * restores the original data. This class contains no React and no business
 * rules beyond persistence bookkeeping (completedDate, blocker fields).
 */

import { DEMO_EMPLOYEE_ID, MOCK_LATENCY_MS, demoDateOffset } from '../config/demoConfig';
import { selectManagerSummary } from '../domain/selectors';
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockFastPassRepository implements FastPassRepository {
  private employee: Employee;
  private tasks: EmployeeTask[];
  private readonly milestones: Milestone[];
  private readonly resources: Resource[];

  constructor(private readonly latencyMs: number = MOCK_LATENCY_MS) {
    this.employee = cloneMockEmployee();
    this.tasks = cloneMockTasks();
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

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<EmployeeTask> {
    await delay(this.latencyMs);
    const task = this.requireTask(taskId);
    task.status = status;
    if (status === 'Completed') {
      task.completedDate = task.completedDate ?? demoDateOffset(0);
      task.blockerFlag = false;
      task.blockerDescription = null;
    } else {
      task.completedDate = null;
    }
    if (status === 'Blocked') {
      task.blockerFlag = true;
      task.blockerDescription =
        task.blockerDescription ?? 'Marked blocked. Add a description of what is needed.';
    }
    if (status === 'In Progress' || status === 'Not Started') {
      task.blockerFlag = false;
      task.blockerDescription = null;
    }
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
    return this.snapshot();
  }

  async resetDemo(): Promise<FastPassDataSnapshot> {
    await delay(this.latencyMs);
    this.employee = cloneMockEmployee();
    this.tasks = cloneMockTasks();
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
