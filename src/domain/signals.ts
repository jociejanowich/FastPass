/**
 * Completion signals.
 *
 * FastPass does not ask the employee to tick boxes. Task status is *detected*
 * from the systems that already know the answer: device management, the LMS,
 * access management, collaboration, calendar, and the knowledge base.
 *
 * A `SignalReading` is one observation from one of those systems. The mock
 * signal source simulates them for the demo; a real deployment would read
 * Microsoft Graph, Intune, an LMS API, an ITSM tool, etc.
 */

import type { TaskStatus } from './types';

export type SignalSource =
  | 'device-management'
  | 'identity'
  | 'learning'
  | 'access-management'
  | 'collaboration'
  | 'calendar'
  | 'source-control'
  | 'knowledge-base';

export type SignalStatus = 'complete' | 'in-progress' | 'not-started' | 'blocked';

export interface SignalReading {
  /** Stable key a detection rule points at, e.g. "lms.security". */
  key: string;
  source: SignalSource;
  status: SignalStatus;
  /** Human-readable explanation of what the system observed. */
  detail: string;
  /** When the system last reported, or null if it never has. */
  observedAt: string | null;
}

export const SIGNAL_TO_TASK_STATUS: Record<SignalStatus, TaskStatus> = {
  complete: 'Completed',
  'in-progress': 'In Progress',
  'not-started': 'Not Started',
  blocked: 'Blocked',
};

export const SIGNAL_SOURCE_LABEL: Record<SignalSource, string> = {
  'device-management': 'Device management',
  identity: 'Identity',
  learning: 'Learning',
  'access-management': 'Access management',
  collaboration: 'Collaboration',
  calendar: 'Calendar',
  'source-control': 'Source control',
  'knowledge-base': 'Knowledge base',
};

/** Order the connected-systems panel lists sources in. */
export const SIGNAL_SOURCE_ORDER: readonly SignalSource[] = [
  'device-management',
  'access-management',
  'learning',
  'collaboration',
  'calendar',
  'knowledge-base',
  'identity',
  'source-control',
];
