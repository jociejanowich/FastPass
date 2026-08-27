import { describe, expect, it } from 'vitest';
import { MockFastPassRepository } from './MockFastPassRepository';
import { calculateProgressPercentage } from '../domain/businessRules';
import { DEMO_EMPLOYEE_ID } from '../config/demoConfig';
import type { SignalReading } from '../domain/signals';

// latency 0 keeps the tests fast
function repo(): MockFastPassRepository {
  return new MockFastPassRepository(0);
}

function reading(overrides: Partial<SignalReading> & Pick<SignalReading, 'key'>): SignalReading {
  return {
    source: 'access-management',
    status: 'complete',
    detail: 'reported complete',
    observedAt: '2026-09-08T09:00:00.000Z',
    ...overrides,
  };
}

describe('MockFastPassRepository — signal-driven status', () => {
  it('derives the initial state from signals (50% progress, one blocker)', async () => {
    const tasks = await repo().getEmployeeTasks(DEMO_EMPLOYEE_ID);
    expect(calculateProgressPercentage(tasks)).toBe(50);
    expect(tasks.filter((t) => t.status === 'Blocked').map((t) => t.name)).toEqual([
      'Setup Laptop',
    ]);
  });

  it('re-derives a task when its connected system reports completion', async () => {
    const r = repo();
    const snapshot = await r.ingestSignal(reading({ key: 'access.engineering' }));
    const task = snapshot.tasks.find((t) => t.name === 'Request Required Access');
    expect(task?.status).toBe('Completed');
    expect(calculateProgressPercentage(snapshot.tasks)).toBe(60);
  });

  it('unblocks a task when the blocking system clears', async () => {
    const r = repo();
    const snapshot = await r.ingestSignal(
      reading({ key: 'device.enrolled', source: 'device-management' }),
    );
    const task = snapshot.tasks.find((t) => t.name === 'Setup Laptop');
    expect(task?.status).toBe('Completed');
    expect(task?.blockerFlag).toBe(false);
    expect(snapshot.tasks.some((t) => t.status === 'Blocked')).toBe(false);
  });

  it('rejects manual status changes to auto-detected tasks', async () => {
    const r = repo();
    const tasks = await r.getEmployeeTasks(DEMO_EMPLOYEE_ID);
    const setupLaptop = tasks.find((t) => t.name === 'Setup Laptop');
    await expect(r.updateTaskStatus(setupLaptop!.id, 'Completed')).rejects.toThrow(
      /detected automatically/,
    );
  });

  it('resetDemo restores the original signal state', async () => {
    const r = repo();
    await r.ingestSignal(reading({ key: 'access.engineering' }));
    const snapshot = await r.resetDemo();
    expect(calculateProgressPercentage(snapshot.tasks)).toBe(50);
  });
});
