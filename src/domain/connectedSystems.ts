/**
 * View model for the "Connected systems" panel: the systems FastPass reads
 * completion from, grouped by source, each with its signals and the task each
 * one drives.
 */

import { DETECTION_RULES } from './detection';
import {
  SIGNAL_SOURCE_LABEL,
  SIGNAL_SOURCE_ORDER,
  SIGNAL_TO_TASK_STATUS,
  type SignalReading,
  type SignalSource,
} from './signals';
import type { EmployeeTask, TaskStatus } from './types';

export interface ConnectedSignal {
  key: string;
  taskName: string;
  taskStatus: TaskStatus;
  reading: SignalReading | null;
}

export interface ConnectedSystemViewModel {
  source: SignalSource;
  label: string;
  signals: ConnectedSignal[];
  satisfiedCount: number;
  total: number;
  hasBlocker: boolean;
}

export function selectConnectedSystems(
  tasks: readonly EmployeeTask[],
  signals: readonly SignalReading[],
): ConnectedSystemViewModel[] {
  const bySource = new Map<SignalSource, ConnectedSignal[]>();

  for (const rule of DETECTION_RULES) {
    const reading = signals.find((signal) => signal.key === rule.signalKey) ?? null;
    const task = tasks.find((candidate) => candidate.name === rule.taskName);
    const taskStatus: TaskStatus =
      task?.status ?? (reading ? SIGNAL_TO_TASK_STATUS[reading.status] : 'Not Started');
    const entry: ConnectedSignal = {
      key: rule.signalKey,
      taskName: rule.taskName,
      taskStatus,
      reading,
    };
    const list = bySource.get(rule.source) ?? [];
    list.push(entry);
    bySource.set(rule.source, list);
  }

  return SIGNAL_SOURCE_ORDER.filter((source) => bySource.has(source)).map((source) => {
    const entries = bySource.get(source) ?? [];
    return {
      source,
      label: SIGNAL_SOURCE_LABEL[source],
      signals: entries,
      satisfiedCount: entries.filter((entry) => entry.taskStatus === 'Completed').length,
      total: entries.length,
      hasBlocker: entries.some((entry) => entry.taskStatus === 'Blocked'),
    };
  });
}

export interface SignalSyncSummary {
  connectedCount: number;
  totalSignals: number;
  satisfied: number;
  pending: number;
  blocked: number;
}

export function summarizeSignals(signals: readonly SignalReading[]): SignalSyncSummary {
  return {
    connectedCount: new Set(signals.map((signal) => signal.source)).size,
    totalSignals: signals.length,
    satisfied: signals.filter((signal) => signal.status === 'complete').length,
    pending: signals.filter(
      (signal) => signal.status === 'in-progress' || signal.status === 'not-started',
    ).length,
    blocked: signals.filter((signal) => signal.status === 'blocked').length,
  };
}
