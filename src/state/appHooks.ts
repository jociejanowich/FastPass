import { useContext } from 'react';
import { AppContext, type AppActions, type AppContextValue } from './context';
import type { AppState } from './types';

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useAppState(): AppState {
  return useAppContext().state;
}

export function useAppActions(): AppActions {
  return useAppContext().actions;
}
