import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProfileAnalysis } from '../domain/profileAnalysis';
import {
  createProfileAnalysisService,
  type ProfileAnalysisService,
} from '../data/ProfileAnalysisService';
import { useAppState } from './appHooks';

export type ProfileAnalysisState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'ready'; analysis: ProfileAnalysis }
  | { status: 'error'; message: string };

export interface UseProfileAnalysisResult {
  state: ProfileAnalysisState;
  reload: () => void;
}

/**
 * Runs the profile analysis automatically once the app data is loaded and the
 * "About Me" screen mounts. Exposes a loading state for the
 * "Analyzing your onboarding journey…" indicator and a manual reload fallback.
 */
export function useProfileAnalysis(
  service: ProfileAnalysisService = createProfileAnalysisService(),
): UseProfileAnalysisResult {
  const { status: appStatus, employee, tasks, milestones, resources } = useAppState();
  const serviceRef = useRef(service);
  const [state, setState] = useState<ProfileAnalysisState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  const ready = appStatus === 'ready' && employee !== null;

  const run = useCallback(async () => {
    if (!employee) return;
    setState({ status: 'analyzing' });
    try {
      const analysis = await serviceRef.current.analyze({
        employee,
        tasks,
        milestones,
        resources,
      });
      setState({ status: 'ready', analysis });
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'We could not generate your profile right now.',
      });
    }
  }, [employee, tasks, milestones, resources]);

  useEffect(() => {
    if (ready) {
      void run();
    }
    // re-run when the underlying data changes or a reload is requested
  }, [ready, run, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return useMemo(() => ({ state, reload }), [state, reload]);
}
