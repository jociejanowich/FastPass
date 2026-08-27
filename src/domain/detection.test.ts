import { describe, expect, it } from 'vitest';
import { applySignalsToTasks, findSignalForTask, getDetectionRule } from './detection';
import type { SignalReading } from './signals';
import { makeTask } from './testFactories';

function reading(
  overrides: Partial<SignalReading> & Pick<SignalReading, 'key' | 'status'>,
): SignalReading {
  return {
    source: 'learning',
    detail: 'test detail',
    observedAt: '2026-09-06T00:00:00.000Z',
    ...overrides,
  };
}

describe('getDetectionRule', () => {
  it('maps known task names to a source and signal key', () => {
    expect(getDetectionRule('Complete Security Training')).toEqual({
      taskName: 'Complete Security Training',
      source: 'learning',
      signalKey: 'lms.security',
    });
  });
  it('returns undefined for an unmapped task name', () => {
    expect(getDetectionRule('Some Other Task')).toBeUndefined();
  });
});

describe('applySignalsToTasks', () => {
  it('sets a task to Completed when its signal is complete', () => {
    const tasks = [makeTask({ name: 'Complete Security Training', status: 'Not Started' })];
    const [result] = applySignalsToTasks(tasks, [
      reading({ key: 'lms.security', status: 'complete' }),
    ]);
    expect(result?.status).toBe('Completed');
    expect(result?.completedDate).toBe('2026-09-06T00:00:00.000Z');
    expect(result?.blockerFlag).toBe(false);
  });

  it('sets a task to Blocked and copies the signal detail into the blocker', () => {
    const tasks = [makeTask({ name: 'Setup Laptop', status: 'Not Started' })];
    const [result] = applySignalsToTasks(tasks, [
      reading({
        key: 'device.enrolled',
        source: 'device-management',
        status: 'blocked',
        detail: 'No device assigned; ticket HRDW-4821 open.',
      }),
    ]);
    expect(result?.status).toBe('Blocked');
    expect(result?.blockerFlag).toBe(true);
    expect(result?.blockerDescription).toBe('No device assigned; ticket HRDW-4821 open.');
  });

  it('maps in-progress and not-started signals', () => {
    const tasks = [
      makeTask({ name: 'Request Required Access' }),
      makeTask({ name: 'Meet Manager' }),
    ];
    const result = applySignalsToTasks(tasks, [
      reading({ key: 'access.engineering', source: 'access-management', status: 'in-progress' }),
      reading({
        key: 'calendar.manager-intro',
        source: 'calendar',
        status: 'not-started',
        observedAt: null,
      }),
    ]);
    expect(result[0]?.status).toBe('In Progress');
    expect(result[1]?.status).toBe('Not Started');
  });

  it('leaves tasks without a detection rule untouched', () => {
    const tasks = [makeTask({ name: 'Freeform manual task', status: 'In Progress' })];
    const [result] = applySignalsToTasks(tasks, []);
    expect(result?.status).toBe('In Progress');
  });

  it('leaves a mapped task untouched when no matching signal is present', () => {
    const tasks = [makeTask({ name: 'Review Engineering Wiki', status: 'Not Started' })];
    const [result] = applySignalsToTasks(tasks, []);
    expect(result?.status).toBe('Not Started');
  });

  it('clears a stale blocker when the signal is no longer blocked', () => {
    const tasks = [
      makeTask({
        name: 'Setup Laptop',
        status: 'Blocked',
        blockerFlag: true,
        blockerDescription: 'old blocker text',
      }),
    ];
    const [result] = applySignalsToTasks(tasks, [
      reading({ key: 'device.enrolled', source: 'device-management', status: 'complete' }),
    ]);
    expect(result?.status).toBe('Completed');
    expect(result?.blockerFlag).toBe(false);
    expect(result?.blockerDescription).toBeNull();
  });
});

describe('findSignalForTask', () => {
  it('resolves the signal a task is driven by', () => {
    const signal = reading({ key: 'wiki.home', source: 'knowledge-base', status: 'complete' });
    expect(findSignalForTask('Review Engineering Wiki', [signal])).toBe(signal);
    expect(findSignalForTask('Review Engineering Wiki', [])).toBeUndefined();
  });
});
