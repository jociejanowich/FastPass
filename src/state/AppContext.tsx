import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { generateAssistantReply } from '../domain/assistantEngine';
import { selectEmployeeViewModel } from '../domain/selectors';
import type { TaskStatus, Viewer } from '../domain/types';
import { createRepository } from '../data/repositoryFactory';
import type { FastPassRepository } from '../data/FastPassRepository';
import { createId } from '../utils/id';
import { appReducer, initialAppState } from './appReducer';
import { AppContext, type AppContextValue } from './context';

const ASSISTANT_THINKING_MS = 450;

interface AppProviderProps {
  children: ReactNode;
  repository?: FastPassRepository;
  autoLoad?: boolean;
}

export function AppProvider({
  children,
  repository,
  autoLoad = true,
}: AppProviderProps): JSX.Element {
  const repoRef = useRef<FastPassRepository>(repository ?? createRepository());
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const load = useCallback(async () => {
    dispatch({ type: 'load/start' });
    try {
      const snapshot = await repoRef.current.refresh();
      dispatch({
        type: 'load/success',
        payload: { ...snapshot, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      dispatch({
        type: 'load/error',
        payload: {
          message:
            error instanceof Error
              ? error.message
              : 'Unable to load onboarding data. Try refreshing.',
        },
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    dispatch({ type: 'mutation/start' });
    try {
      const snapshot = await repoRef.current.refresh();
      dispatch({
        type: 'snapshot/replaced',
        payload: { ...snapshot, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      dispatch({
        type: 'load/error',
        payload: {
          message: error instanceof Error ? error.message : 'Refresh failed.',
        },
      });
    } finally {
      dispatch({ type: 'mutation/end' });
    }
  }, []);

  const resetDemo = useCallback(async () => {
    if (!repoRef.current.resetDemo) return;
    dispatch({ type: 'mutation/start' });
    try {
      const snapshot = await repoRef.current.resetDemo();
      dispatch({
        type: 'snapshot/replaced',
        payload: { ...snapshot, timestamp: new Date().toISOString() },
      });
      dispatch({ type: 'assistant/reset' });
    } finally {
      dispatch({ type: 'mutation/end' });
    }
  }, []);

  const setTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    dispatch({ type: 'mutation/start' });
    try {
      const updated = await repoRef.current.updateTaskStatus(taskId, status);
      dispatch({ type: 'task/updated', payload: { task: updated } });
    } finally {
      dispatch({ type: 'mutation/end' });
    }
  }, []);

  const setTaskBlocker = useCallback(
    async (taskId: string, blockerFlag: boolean, description: string | null) => {
      dispatch({ type: 'mutation/start' });
      try {
        const updated = await repoRef.current.updateTaskBlocker(taskId, blockerFlag, description);
        dispatch({ type: 'task/updated', payload: { task: updated } });
      } finally {
        dispatch({ type: 'mutation/end' });
      }
    },
    [],
  );

  const sendAssistantMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    dispatch({
      type: 'assistant/message',
      payload: {
        message: {
          id: createId('msg'),
          role: 'user',
          text: trimmed,
          timestamp: new Date().toISOString(),
        },
      },
    });
    dispatch({ type: 'assistant/processing', payload: { processing: true } });

    await new Promise((resolve) => setTimeout(resolve, ASSISTANT_THINKING_MS));

    const current = stateRef.current;
    let replyText =
      'I could not read your onboarding data just now. Try the Refresh control and ask again.';
    let intent: ReturnType<typeof generateAssistantReply>['intent'] = 'fallback';
    let citations: ReturnType<typeof generateAssistantReply>['citations'] = [];

    if (current.employee) {
      const employeeVm = selectEmployeeViewModel(
        current.employee,
        current.tasks,
        current.milestones,
      );
      const reply = generateAssistantReply(
        {
          employee: employeeVm,
          tasks: current.tasks,
          milestones: current.milestones,
          resources: current.resources,
        },
        trimmed,
      );
      replyText = reply.text;
      intent = reply.intent;
      citations = reply.citations;
    }

    dispatch({
      type: 'assistant/message',
      payload: {
        message: {
          id: createId('msg'),
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toISOString(),
          intent,
          citations,
        },
      },
    });
    dispatch({ type: 'assistant/processing', payload: { processing: false } });
  }, []);

  const resetAssistant = useCallback(() => {
    dispatch({ type: 'assistant/reset' });
  }, []);

  const setViewer = useCallback((viewer: Viewer) => {
    dispatch({ type: 'viewer/set', payload: { viewer } });
  }, []);

  useEffect(() => {
    if (autoLoad) {
      void load();
    }
  }, [autoLoad, load]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      actions: {
        load,
        refresh,
        resetDemo,
        setTaskStatus,
        setTaskBlocker,
        setViewer,
        sendAssistantMessage,
        resetAssistant,
      },
    }),
    [
      state,
      load,
      refresh,
      resetDemo,
      setTaskStatus,
      setTaskBlocker,
      setViewer,
      sendAssistantMessage,
      resetAssistant,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
