import type { EmployeeTask } from './types';

let sequence = 0;

/** Build an EmployeeTask with sensible defaults for tests. */
export function makeTask(overrides: Partial<EmployeeTask> = {}): EmployeeTask {
  sequence += 1;
  return {
    id: `task-${sequence}`,
    employeeId: 'EMP-TEST',
    name: `Task ${sequence}`,
    description: 'Test task',
    status: 'Not Started',
    dueDate: null,
    completedDate: null,
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Account Setup',
    recommendedResourceId: null,
    ...overrides,
  };
}
