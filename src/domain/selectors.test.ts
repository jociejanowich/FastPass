import { describe, expect, it } from 'vitest';
import {
  selectBlockers,
  selectCurrentMilestoneName,
  selectEmployeeViewModel,
  selectManagerSummary,
  selectMilestoneViewModels,
  selectRecommendedSteps,
} from './selectors';
import { MOCK_EMPLOYEE, MOCK_MILESTONES, MOCK_RESOURCES, MOCK_TASKS } from '../data/mockData';

describe('selectMilestoneViewModels (demo data)', () => {
  const vms = selectMilestoneViewModels(MOCK_MILESTONES, MOCK_TASKS);

  it('marks Account Setup blocked because Setup Laptop is blocked', () => {
    expect(vms.find((vm) => vm.id === 'account-setup')?.status).toBe('Blocked');
  });
  it('marks Training & Compliance complete', () => {
    expect(vms.find((vm) => vm.id === 'training-compliance')?.status).toBe('Complete');
  });
  it('marks Tool Access & Setup in progress', () => {
    expect(vms.find((vm) => vm.id === 'tool-access')?.status).toBe('In Progress');
  });
});

describe('selectCurrentMilestoneName', () => {
  it('is the first milestone that is not complete', () => {
    expect(selectCurrentMilestoneName(MOCK_MILESTONES, MOCK_TASKS)).toBe('Account Setup');
  });
});

describe('selectEmployeeViewModel (demo data)', () => {
  const vm = selectEmployeeViewModel(MOCK_EMPLOYEE, MOCK_TASKS, MOCK_MILESTONES);

  it('derives 50% progress from 5 of 10 required tasks complete', () => {
    expect(vm.progressPercentage).toBe(50);
    expect(vm.journeyStatus).toBe('In Progress');
  });
  it('reports one blocker and is not production ready', () => {
    expect(vm.blockerCount).toBe(1);
    expect(vm.readiness.ready).toBe(false);
    expect(vm.readiness.tasksRemaining).toBe(5);
  });
});

describe('selectRecommendedSteps (demo data)', () => {
  it('recommends the blocked task first with its resource attached', () => {
    const steps = selectRecommendedSteps(MOCK_TASKS, MOCK_RESOURCES, 2);
    expect(steps).toHaveLength(2);
    expect(steps[0]?.task.name).toBe('Setup Laptop');
    expect(steps[0]?.resource?.id).toBe('res-it-portal');
  });
});

describe('selectBlockers (demo data)', () => {
  it('describes the blocked task and lists its milestone siblings as dependents', () => {
    const blockers = selectBlockers(MOCK_TASKS, MOCK_MILESTONES, MOCK_RESOURCES);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]?.task.name).toBe('Setup Laptop');
    expect(blockers[0]?.dependentTaskNames).toEqual(['Join Teams Channels', 'Meet Manager']);
    expect(blockers[0]?.resource?.id).toBe('res-it-portal');
  });
});

describe('selectManagerSummary (demo data)', () => {
  const summary = selectManagerSummary(
    MOCK_EMPLOYEE,
    MOCK_TASKS,
    MOCK_MILESTONES,
    MOCK_RESOURCES,
    '2026-09-08T09:00:00.000Z',
  );

  it('carries progress, one blocker, and the completed-task list', () => {
    expect(summary.progressPercentage).toBe(50);
    expect(summary.blockers).toHaveLength(1);
    expect(summary.blockers[0]?.taskName).toBe('Setup Laptop');
    expect(summary.completedTasks).toHaveLength(5);
    expect(summary.priorityTasks[0]?.taskName).toBe('Setup Laptop');
  });
});
