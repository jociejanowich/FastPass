import { describe, expect, it } from 'vitest';
import { daysFromToday, formatDate, formatDueRelative, isOverdue } from './date';

// DEMO_TODAY is 2026-09-08.

describe('formatDate', () => {
  it('formats an ISO date in UTC', () => {
    expect(formatDate('2026-09-09T00:00:00.000Z')).toBe('Sep 9, 2026');
  });
  it('handles missing / invalid input', () => {
    expect(formatDate(null)).toBe('No due date');
    expect(formatDate('not-a-date')).toBe('No due date');
  });
});

describe('daysFromToday', () => {
  it('is 0 for the demo today', () => {
    expect(daysFromToday('2026-09-08T12:00:00.000Z')).toBe(0);
  });
  it('is negative in the past and positive in the future', () => {
    expect(daysFromToday('2026-09-05T00:00:00.000Z')).toBe(-3);
    expect(daysFromToday('2026-09-15T00:00:00.000Z')).toBe(7);
  });
});

describe('formatDueRelative', () => {
  it('describes past, present, and future', () => {
    expect(formatDueRelative('2026-09-08T00:00:00.000Z')).toBe('Due today');
    expect(formatDueRelative('2026-09-09T00:00:00.000Z')).toBe('Due tomorrow');
    expect(formatDueRelative('2026-09-11T00:00:00.000Z')).toBe('Due in 3 days');
    expect(formatDueRelative('2026-09-06T00:00:00.000Z')).toBe('Overdue by 2 days');
  });
});

describe('isOverdue', () => {
  it('is true only for past dates', () => {
    expect(isOverdue('2026-09-01T00:00:00.000Z')).toBe(true);
    expect(isOverdue('2026-09-20T00:00:00.000Z')).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});
