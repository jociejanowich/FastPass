/**
 * Detection rules: which system proves a task is done.
 *
 * Rules are keyed by the exact task name (the same convention used for
 * milestone and resource mapping). `applySignalsToTasks` is a pure function
 * that rewrites task status from the latest signal readings — this is what
 * makes the to-do list automatic instead of manual.
 */

import { SIGNAL_TO_TASK_STATUS, type SignalReading, type SignalSource } from './signals';
import type { EmployeeTask } from './types';

export interface DetectionRule {
  taskName: string;
  source: SignalSource;
  signalKey: string;
}

export const DETECTION_RULES: readonly DetectionRule[] = [
  { taskName: 'Setup Laptop', source: 'device-management', signalKey: 'device.enrolled' },
  { taskName: 'Join Teams Channels', source: 'collaboration', signalKey: 'teams.channels' },
  { taskName: 'Meet Manager', source: 'calendar', signalKey: 'calendar.manager-intro' },
  {
    taskName: 'Install Development Tools',
    source: 'device-management',
    signalKey: 'device.devtools',
  },
  {
    taskName: 'Request Required Access',
    source: 'access-management',
    signalKey: 'access.engineering',
  },
  { taskName: 'Complete Security Training', source: 'learning', signalKey: 'lms.security' },
  {
    taskName: 'Complete Compliance Training',
    source: 'learning',
    signalKey: 'lms.compliance',
  },
  {
    taskName: 'Read Engineering Standards',
    source: 'knowledge-base',
    signalKey: 'wiki.standards',
  },
  { taskName: 'Review Engineering Wiki', source: 'knowledge-base', signalKey: 'wiki.home' },
  { taskName: 'First Manager Check-In', source: 'calendar', signalKey: 'calendar.checkin' },
];

const RULE_BY_TASK = new Map(DETECTION_RULES.map((rule) => [rule.taskName, rule]));

export function getDetectionRule(taskName: string): DetectionRule | undefined {
  return RULE_BY_TASK.get(taskName);
}

export function isAutoDetected(taskName: string): boolean {
  return RULE_BY_TASK.has(taskName);
}

export function findSignalForTask(
  taskName: string,
  signals: readonly SignalReading[],
): SignalReading | undefined {
  const rule = getDetectionRule(taskName);
  if (!rule) return undefined;
  return signals.find((signal) => signal.key === rule.signalKey);
}

/**
 * Rewrite task status from signal readings. Tasks with a detection rule take
 * their status from the matching signal; tasks without a rule are left as-is
 * (manual fallback).
 */
export function applySignalsToTasks(
  tasks: readonly EmployeeTask[],
  signals: readonly SignalReading[],
): EmployeeTask[] {
  return tasks.map((task) => {
    const reading = findSignalForTask(task.name, signals);
    if (!reading) return { ...task };

    const status = SIGNAL_TO_TASK_STATUS[reading.status];
    const isComplete = status === 'Completed';
    const isBlocked = status === 'Blocked';

    return {
      ...task,
      status,
      completedDate: isComplete ? (task.completedDate ?? reading.observedAt) : null,
      blockerFlag: isBlocked,
      blockerDescription: isBlocked ? reading.detail : null,
    };
  });
}
