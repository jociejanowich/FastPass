import { useMemo } from 'react';
import { groupTasksByStatus } from '../domain/businessRules';
import {
  selectConnectedSystems,
  summarizeSignals,
  type ConnectedSystemViewModel,
  type SignalSyncSummary,
} from '../domain/connectedSystems';
import { findSignalForTask } from '../domain/detection';
import type { SignalReading } from '../domain/signals';
import {
  selectBlockers,
  selectEmployeeViewModel,
  selectManagerSummary,
  selectMilestoneViewModels,
  selectRecommendedSteps,
  type BlockerViewModel,
  type EmployeeViewModel,
  type MilestoneViewModel,
  type RecommendedStep,
} from '../domain/selectors';
import type { EmployeeTask, ManagerSummary, Resource, TaskStatus } from '../domain/types';
import { useAppState } from './appHooks';

export function useEmployeeViewModel(): EmployeeViewModel | null {
  const { employee, tasks, milestones } = useAppState();
  return useMemo(
    () => (employee ? selectEmployeeViewModel(employee, tasks, milestones) : null),
    [employee, tasks, milestones],
  );
}

export function useMilestoneViewModels(): MilestoneViewModel[] {
  const { milestones, tasks } = useAppState();
  return useMemo(() => selectMilestoneViewModels(milestones, tasks), [milestones, tasks]);
}

export function useRecommendedSteps(limit = 2): RecommendedStep[] {
  const { tasks, resources } = useAppState();
  return useMemo(() => selectRecommendedSteps(tasks, resources, limit), [tasks, resources, limit]);
}

export function useBlockers(): BlockerViewModel[] {
  const { tasks, milestones, resources } = useAppState();
  return useMemo(
    () => selectBlockers(tasks, milestones, resources),
    [tasks, milestones, resources],
  );
}

export function useGroupedTasks(): Record<TaskStatus, EmployeeTask[]> {
  const { tasks } = useAppState();
  return useMemo(() => groupTasksByStatus(tasks), [tasks]);
}

export function useManagerSummary(): ManagerSummary | null {
  const { employee, tasks, milestones, resources, lastRefreshed } = useAppState();
  return useMemo(
    () =>
      employee
        ? selectManagerSummary(
            employee,
            tasks,
            milestones,
            resources,
            lastRefreshed ?? new Date().toISOString(),
          )
        : null,
    [employee, tasks, milestones, resources, lastRefreshed],
  );
}

export function useConnectedSystems(): ConnectedSystemViewModel[] {
  const { tasks, signals } = useAppState();
  return useMemo(() => selectConnectedSystems(tasks, signals), [tasks, signals]);
}

export function useSignalSummary(): SignalSyncSummary {
  const { signals } = useAppState();
  return useMemo(() => summarizeSignals(signals), [signals]);
}

export function useSignalLookup(): (taskName: string) => SignalReading | null {
  const { signals } = useAppState();
  return useMemo(
    () => (taskName: string) => findSignalForTask(taskName, signals) ?? null,
    [signals],
  );
}

export function useResourceLookup(): (id: string | null) => Resource | null {
  const { resources } = useAppState();
  return useMemo(() => {
    const map = new Map(resources.map((resource) => [resource.id, resource]));
    return (id: string | null) => (id ? (map.get(id) ?? null) : null);
  }, [resources]);
}
