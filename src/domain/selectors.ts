/**
 * Derived view models.
 *
 * Pages and components read these selectors instead of recomputing progress,
 * status, milestone rollups, or readiness on their own.
 */

import {
  calculateProgressPercentage,
  calculateReadiness,
  countTasksByStatus,
  deriveJourneyStatus,
  deriveMilestoneStatus,
  getBlockedTasks,
  getRecommendationReason,
  getRecommendedNextSteps,
  type ReadinessResult,
} from './businessRules';
import type {
  Employee,
  EmployeeTask,
  JourneyStatus,
  Milestone,
  MilestoneId,
  MilestoneStatus,
  ManagerSummary,
  Resource,
  TaskStatus,
} from './types';

export interface RecommendedStep {
  task: EmployeeTask;
  reason: string;
  resource: Resource | null;
}

export interface MilestoneViewModel {
  id: MilestoneId;
  name: string;
  description: string;
  status: MilestoneStatus;
  tasks: EmployeeTask[];
  taskCount: number;
  completedCount: number;
}

export interface BlockerViewModel {
  task: EmployeeTask;
  blockerDescription: string;
  resource: Resource | null;
  recommendedAction: string;
  dependentTaskNames: string[];
}

export interface EmployeeViewModel {
  employee: Employee;
  progressPercentage: number;
  journeyStatus: JourneyStatus;
  currentMilestone: string;
  readiness: ReadinessResult;
  counts: Record<TaskStatus, number>;
  blockerCount: number;
}

export function resolveResource(
  resources: readonly Resource[],
  resourceId: string | null,
): Resource | null {
  if (!resourceId) return null;
  return resources.find((resource) => resource.id === resourceId) ?? null;
}

export function findResourceForTask(
  resources: readonly Resource[],
  taskName: string,
): Resource | null {
  return resources.find((resource) => resource.relatedTaskNames.includes(taskName)) ?? null;
}

function tasksForMilestone(milestone: Milestone, tasks: readonly EmployeeTask[]): EmployeeTask[] {
  return milestone.taskNames
    .map((name) => tasks.find((task) => task.name === name))
    .filter((task): task is EmployeeTask => task !== undefined);
}

export function selectMilestoneViewModels(
  milestones: readonly Milestone[],
  tasks: readonly EmployeeTask[],
): MilestoneViewModel[] {
  return milestones.map((milestone) => {
    const milestoneTasks = tasksForMilestone(milestone, tasks);
    return {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      status: deriveMilestoneStatus(milestoneTasks),
      tasks: milestoneTasks,
      taskCount: milestoneTasks.length,
      completedCount: milestoneTasks.filter((task) => task.status === 'Completed').length,
    };
  });
}

/**
 * The employee's current milestone: the first milestone (in order) that is not
 * yet Complete. If every milestone is complete, the last one is returned.
 */
export function selectCurrentMilestoneName(
  milestones: readonly Milestone[],
  tasks: readonly EmployeeTask[],
): string {
  const viewModels = selectMilestoneViewModels(milestones, tasks);
  const active = viewModels.find((vm) => vm.status !== 'Complete');
  return active?.name ?? viewModels[viewModels.length - 1]?.name ?? 'Onboarding';
}

export function selectRecommendedSteps(
  tasks: readonly EmployeeTask[],
  resources: readonly Resource[],
  limit = 2,
): RecommendedStep[] {
  return getRecommendedNextSteps(tasks, limit).map((task) => ({
    task,
    reason: getRecommendationReason(task),
    resource:
      resolveResource(resources, task.recommendedResourceId) ??
      findResourceForTask(resources, task.name),
  }));
}

function recommendedActionForBlocker(task: EmployeeTask): string {
  switch (task.name) {
    case 'Setup Laptop':
      return 'Follow up on the open hardware request and request a loaner device so setup can continue.';
    default:
      return 'Escalate the blocker to your manager and use the linked resource to unblock it.';
  }
}

export function selectBlockers(
  tasks: readonly EmployeeTask[],
  milestones: readonly Milestone[],
  resources: readonly Resource[],
): BlockerViewModel[] {
  return getBlockedTasks(tasks).map((task) => {
    const owningMilestone = milestones.find((milestone) => milestone.taskNames.includes(task.name));
    const dependentTaskNames = owningMilestone
      ? owningMilestone.taskNames.filter((name) => name !== task.name)
      : [];
    return {
      task,
      blockerDescription: task.blockerDescription ?? 'This task is blocked and needs attention.',
      resource:
        resolveResource(resources, task.recommendedResourceId) ??
        findResourceForTask(resources, task.name),
      recommendedAction: recommendedActionForBlocker(task),
      dependentTaskNames,
    };
  });
}

export function selectEmployeeViewModel(
  employee: Employee,
  tasks: readonly EmployeeTask[],
  milestones: readonly Milestone[],
): EmployeeViewModel {
  const progressPercentage = calculateProgressPercentage(tasks);
  return {
    employee,
    progressPercentage,
    journeyStatus: deriveJourneyStatus(progressPercentage),
    currentMilestone: selectCurrentMilestoneName(milestones, tasks),
    readiness: calculateReadiness(tasks),
    counts: countTasksByStatus(tasks),
    blockerCount: getBlockedTasks(tasks).length,
  };
}

export function selectManagerSummary(
  employee: Employee,
  tasks: readonly EmployeeTask[],
  milestones: readonly Milestone[],
  resources: readonly Resource[],
  generatedAt: string,
): ManagerSummary {
  const progressPercentage = calculateProgressPercentage(tasks);
  const blockers = selectBlockers(tasks, milestones, resources).map((blocker) => ({
    taskName: blocker.task.name,
    dueDate: blocker.task.dueDate,
    blockerDescription: blocker.blockerDescription,
    recommendedAction: blocker.recommendedAction,
  }));
  const priorityTasks = getRecommendedNextSteps(tasks, 3).map((task) => ({
    taskName: task.name,
    dueDate: task.dueDate,
    status: task.status,
  }));
  const completedTasks = tasks
    .filter((task) => task.status === 'Completed')
    .map((task) => ({
      taskName: task.name,
      dueDate: task.dueDate,
      status: task.status,
    }));
  return {
    employeeName: employee.displayName,
    role: employee.role,
    department: employee.department,
    progressPercentage,
    blockers,
    priorityTasks,
    completedTasks,
    generatedAt,
  };
}
