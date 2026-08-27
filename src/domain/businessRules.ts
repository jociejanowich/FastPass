/**
 * FastPass business rules.
 *
 * Every rule in the product specification lives here as a pure function so it
 * can be unit tested and reused by selectors, pages, and the assistant engine.
 * Presentation components must not re-derive these values independently.
 */

import type { EmployeeTask, JourneyStatus, MilestoneStatus, TaskStatus } from './types';

/** Order used when grouping the Tasks page into collapsible sections. */
export const TASK_SECTION_ORDER: readonly TaskStatus[] = [
  'Blocked',
  'In Progress',
  'Not Started',
  'Completed',
] as const;

/** Priority order for the "Recommended next steps" rule (Completed excluded). */
const RECOMMENDATION_PRIORITY: Record<Exclude<TaskStatus, 'Completed'>, number> = {
  Blocked: 0,
  'In Progress': 1,
  'Not Started': 2,
};

/**
 * Compare two ISO date strings ascending. Tasks without a due date always sort
 * last, regardless of sort direction.
 */
export function compareByDueDateAscending(
  a: Pick<EmployeeTask, 'dueDate'>,
  b: Pick<EmployeeTask, 'dueDate'>,
): number {
  if (a.dueDate === b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

/**
 * Progress = completed required tasks / total required tasks * 100, rounded to a
 * whole number. Returns 0 when there are no required tasks (no divide by zero).
 */
export function calculateProgressPercentage(tasks: readonly EmployeeTask[]): number {
  const required = tasks.filter((task) => task.required);
  if (required.length === 0) return 0;
  const completed = required.filter((task) => task.status === 'Completed').length;
  return Math.round((completed / required.length) * 100);
}

/**
 * Journey status derived from a progress percentage:
 * 0 -> Not Started, 1..99 -> In Progress, 100 -> Completed.
 */
export function deriveJourneyStatus(progressPercentage: number): JourneyStatus {
  const clamped = Math.max(0, Math.min(100, Math.round(progressPercentage)));
  if (clamped <= 0) return 'Not Started';
  if (clamped >= 100) return 'Completed';
  return 'In Progress';
}

/**
 * Recommended next steps:
 * - exclude Completed tasks
 * - Blocked first, then In Progress, then Not Started
 * - within a status, earliest due date first (no due date last)
 * - return the first two
 */
export function getRecommendedNextSteps(tasks: readonly EmployeeTask[], limit = 2): EmployeeTask[] {
  return tasks
    .filter((task): task is EmployeeTask => task.status !== 'Completed')
    .slice()
    .sort((a, b) => {
      const priorityDelta =
        RECOMMENDATION_PRIORITY[a.status as Exclude<TaskStatus, 'Completed'>] -
        RECOMMENDATION_PRIORITY[b.status as Exclude<TaskStatus, 'Completed'>];
      if (priorityDelta !== 0) return priorityDelta;
      return compareByDueDateAscending(a, b);
    })
    .slice(0, limit);
}

/** Human-readable reason a task was recommended, used on the dashboard. */
export function getRecommendationReason(task: EmployeeTask): string {
  switch (task.status) {
    case 'Blocked':
      return 'Blocked — resolve this first so dependent work can continue.';
    case 'In Progress':
      return 'Already in progress — finishing it keeps your momentum.';
    case 'Not Started':
      return task.dueDate
        ? 'Not started and due soon.'
        : 'Not started — a good next task to pick up.';
    default:
      return 'Recommended next step.';
  }
}

/**
 * Group tasks into the four Tasks-page sections. Each section is sorted by due
 * date ascending with undated tasks last.
 */
export function groupTasksByStatus(
  tasks: readonly EmployeeTask[],
): Record<TaskStatus, EmployeeTask[]> {
  const groups: Record<TaskStatus, EmployeeTask[]> = {
    Blocked: [],
    'In Progress': [],
    'Not Started': [],
    Completed: [],
  };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  for (const status of TASK_SECTION_ORDER) {
    groups[status].sort(compareByDueDateAscending);
  }
  return groups;
}

/**
 * Milestone status:
 * - any task Blocked -> Blocked
 * - else every task Completed -> Complete
 * - else at least one Completed or In Progress -> In Progress
 * - else Not Started
 */
export function deriveMilestoneStatus(milestoneTasks: readonly EmployeeTask[]): MilestoneStatus {
  if (milestoneTasks.length === 0) return 'Not Started';
  if (milestoneTasks.some((task) => task.status === 'Blocked')) return 'Blocked';
  if (milestoneTasks.every((task) => task.status === 'Completed')) return 'Complete';
  if (milestoneTasks.some((task) => task.status === 'Completed' || task.status === 'In Progress')) {
    return 'In Progress';
  }
  return 'Not Started';
}

export interface ReadinessResult {
  ready: boolean;
  label: string;
  tasksRemaining: number;
  progressPercentage: number;
}

/**
 * Readiness: "Ready for Production Work" only when every required task is
 * Completed. Otherwise "Onboarding In Progress" plus the count of required
 * tasks that are not yet complete.
 */
export function calculateReadiness(tasks: readonly EmployeeTask[]): ReadinessResult {
  const required = tasks.filter((task) => task.required);
  const remaining = required.filter((task) => task.status !== 'Completed').length;
  const progressPercentage = calculateProgressPercentage(tasks);
  const ready = required.length > 0 && remaining === 0;
  return {
    ready,
    label: ready ? 'Ready for Production Work' : 'Onboarding In Progress',
    tasksRemaining: remaining,
    progressPercentage,
  };
}

/** Count tasks by status, always returning all four keys. */
export function countTasksByStatus(tasks: readonly EmployeeTask[]): Record<TaskStatus, number> {
  return {
    Blocked: tasks.filter((task) => task.status === 'Blocked').length,
    'In Progress': tasks.filter((task) => task.status === 'In Progress').length,
    'Not Started': tasks.filter((task) => task.status === 'Not Started').length,
    Completed: tasks.filter((task) => task.status === 'Completed').length,
  };
}

/** Incomplete tasks ordered by soonest due date (undated last). */
export function getTasksDueSoon(tasks: readonly EmployeeTask[], limit = 3): EmployeeTask[] {
  return tasks
    .filter((task) => task.status !== 'Completed')
    .slice()
    .sort(compareByDueDateAscending)
    .slice(0, limit);
}

/** All tasks currently blocked, earliest due date first. */
export function getBlockedTasks(tasks: readonly EmployeeTask[]): EmployeeTask[] {
  return tasks
    .filter((task) => task.status === 'Blocked')
    .slice()
    .sort(compareByDueDateAscending);
}
