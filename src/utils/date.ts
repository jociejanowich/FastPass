/**
 * Date formatting helpers. All relative phrasing is measured against the
 * centralized demo date so the demo reads consistently.
 */

import { demoNow } from '../config/demoConfig';

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'No due date';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return DATE_FORMAT.format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME_FORMAT.format(date);
}

function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Whole-day difference from the demo "today" to the given date (negative = past). */
export function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(date) - startOfDay(demoNow())) / msPerDay);
}

/** Short relative phrase, e.g. "due in 3 days", "overdue by 2 days", "due today". */
export function formatDueRelative(iso: string | null | undefined): string {
  const delta = daysFromToday(iso);
  if (delta === null) return 'No due date';
  if (delta === 0) return 'Due today';
  if (delta === 1) return 'Due tomorrow';
  if (delta === -1) return 'Overdue by 1 day';
  if (delta < 0) return `Overdue by ${Math.abs(delta)} days`;
  return `Due in ${delta} days`;
}

export function isOverdue(iso: string | null | undefined): boolean {
  const delta = daysFromToday(iso);
  return delta !== null && delta < 0;
}
