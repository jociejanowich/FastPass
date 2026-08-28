import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildManagerDashboard, type ManagerDashboard } from '../domain/managerView';
import { createRepository } from '../data/repositoryFactory';
import type { FastPassRepository } from '../data/FastPassRepository';
import { useAppState } from './appHooks';

export type ManagerDashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; dashboard: ManagerDashboard }
  | { status: 'error'; message: string };

export interface UseManagerDashboardResult {
  state: ManagerDashboardState;
  reload: () => void;
}

/**
 * Loads every direct report's onboarding data and builds the Team dashboard.
 * Only runs when the signed-in viewer is a manager. Re-runs when the manager's
 * own tasks change (e.g. a simulated signal) so the two views stay in sync.
 */
export function useManagerDashboard(
  repository: FastPassRepository = createRepository(),
): UseManagerDashboardResult {
  const { viewer, status: appStatus, milestones, resources, tasks } = useAppState();
  const repoRef = useRef(repository);
  const [state, setState] = useState<ManagerDashboardState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  const isManager = viewer.role === 'manager';
  const ready = isManager && appStatus === 'ready';

  const run = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const team = await repoRef.current.getTeamOnboarding(viewer.displayName);
      const dashboard = buildManagerDashboard(
        team,
        milestones,
        resources,
        new Date().toISOString(),
      );
      setState({ status: 'ready', dashboard });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'We could not load your team right now.',
      });
    }
  }, [viewer.displayName, milestones, resources]);

  useEffect(() => {
    if (ready) {
      void run();
    } else if (!isManager) {
      setState({ status: 'idle' });
    }
    // `tasks` in deps: the manager's own report reflects live task changes.
  }, [ready, isManager, run, nonce, tasks]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return useMemo(() => ({ state, reload }), [state, reload]);
}
