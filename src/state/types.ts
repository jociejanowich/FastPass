import type { AssistantCitation, AssistantIntent } from '../domain/assistantEngine';
import type { Employee, EmployeeTask, Milestone, Resource } from '../domain/types';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: AssistantIntent;
  citations?: AssistantCitation[];
}

export interface AssistantState {
  messages: AssistantMessage[];
  processing: boolean;
}

export interface AppState {
  status: LoadStatus;
  error: string | null;
  employee: Employee | null;
  tasks: EmployeeTask[];
  milestones: Milestone[];
  resources: Resource[];
  lastRefreshed: string | null;
  mutating: boolean;
  assistant: AssistantState;
}

export type AppAction =
  | { type: 'load/start' }
  | {
      type: 'load/success';
      payload: {
        employee: Employee;
        tasks: EmployeeTask[];
        milestones: Milestone[];
        resources: Resource[];
        timestamp: string;
      };
    }
  | { type: 'load/error'; payload: { message: string } }
  | { type: 'mutation/start' }
  | { type: 'mutation/end' }
  | { type: 'task/updated'; payload: { task: EmployeeTask } }
  | {
      type: 'snapshot/replaced';
      payload: {
        employee: Employee;
        tasks: EmployeeTask[];
        milestones: Milestone[];
        resources: Resource[];
        timestamp: string;
      };
    }
  | { type: 'assistant/message'; payload: { message: AssistantMessage } }
  | { type: 'assistant/processing'; payload: { processing: boolean } }
  | { type: 'assistant/reset' };
