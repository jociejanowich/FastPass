/**
 * Centralized demo configuration.
 *
 * Every hardcoded date in the demo is derived from DEMO_TODAY so the demo state
 * stays internally consistent and is trivial to shift. Nothing else in the app
 * should hardcode a calendar date.
 */

/** The fixed "current date" the demo is anchored to. */
export const DEMO_TODAY = '2026-09-08T09:00:00.000Z';

export const DEMO_EMPLOYEE_ID = 'EMP-001';

/** Simulated network latency (ms) for the mock repository. */
export const MOCK_LATENCY_MS = 260;

/** Returns a new ISO string offset from DEMO_TODAY by the given number of days. */
export function demoDateOffset(days: number): string {
  const base = new Date(DEMO_TODAY);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString();
}

/** DEMO_TODAY as a Date, for relative-date formatting helpers. */
export function demoNow(): Date {
  return new Date(DEMO_TODAY);
}
