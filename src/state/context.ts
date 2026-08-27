import { createContext } from 'react';
import type { SignalStatus } from '../domain/signals';
import type { TaskStatus } from '../domain/types';
import type { AppState } from './types';

export interface AppActions {
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  resetDemo: () => Promise<void>;
  setTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  setTaskBlocker: (
    taskId: string,
    blockerFlag: boolean,
    description: string | null,
  ) => Promise<void>;
  /** Demo: simulate a connected system reporting a new state for one signal. */
  simulateSignal: (signalKey: string, status: SignalStatus) => Promise<void>;
  sendAssistantMessage: (text: string) => Promise<void>;
  resetAssistant: () => void;
}

export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

export const AppContext = createContext<AppContextValue | null>(null);
