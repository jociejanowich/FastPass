import type { AppAction, AppState } from './types';

export const initialAppState: AppState = {
  status: 'idle',
  error: null,
  employee: null,
  tasks: [],
  milestones: [],
  resources: [],
  signals: [],
  lastRefreshed: null,
  mutating: false,
  assistant: {
    messages: [],
    processing: false,
  },
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'load/start':
      return { ...state, status: 'loading', error: null };

    case 'load/success':
    case 'snapshot/replaced':
      return {
        ...state,
        status: 'ready',
        error: null,
        employee: action.payload.employee,
        tasks: action.payload.tasks,
        milestones: action.payload.milestones,
        resources: action.payload.resources,
        signals: action.payload.signals,
        lastRefreshed: action.payload.timestamp,
      };

    case 'load/error':
      return { ...state, status: 'error', error: action.payload.message };

    case 'mutation/start':
      return { ...state, mutating: true };

    case 'mutation/end':
      return { ...state, mutating: false };

    case 'task/updated':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.task.id ? action.payload.task : task,
        ),
      };

    case 'assistant/message':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          messages: [...state.assistant.messages, action.payload.message],
        },
      };

    case 'assistant/processing':
      return {
        ...state,
        assistant: { ...state.assistant, processing: action.payload.processing },
      };

    case 'assistant/reset':
      return { ...state, assistant: { messages: [], processing: false } };

    default:
      return state;
  }
}
