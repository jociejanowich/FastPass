import type { AssistantCitation, AssistantIntent } from '../domain/assistantEngine';
import type { SignalReading } from '../domain/signals';
import type { Employee, EmployeeTask, Milestone, Resource, Viewer } from '../domain/types';

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
  signals: SignalReading[];
  lastRefreshed: string | null;
  mutating: boolean;
  /** Signed-in identity. Managers additionally see the Team dashboard. */
  viewer: Viewer;
  assistant: AssistantState;
}

export interface SnapshotPayload {
  employee: Employee;
  tasks: EmployeeTask[];
  milestones: Milestone[];
  resources: Resource[];
  signals: SignalReading[];
  timestamp: string;
}

export type AppAction =
  | { type: 'load/start' }
  | { type: 'load/success'; payload: SnapshotPayload }
  | { type: 'load/error'; payload: { message: string } }
  | { type: 'mutation/start' }
  | { type: 'mutation/end' }
  | { type: 'task/updated'; payload: { task: EmployeeTask } }
  | { type: 'snapshot/replaced'; payload: SnapshotPayload }
  | { type: 'assistant/message'; payload: { message: AssistantMessage } }
  | { type: 'assistant/processing'; payload: { processing: boolean } }
  | { type: 'assistant/reset' }
  | { type: 'viewer/set'; payload: { viewer: Viewer } };
