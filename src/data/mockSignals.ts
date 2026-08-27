/**
 * Simulated readings from the systems FastPass would connect to.
 *
 * These reproduce the demo's mixed state (5 complete, 2 in progress, 1 blocked,
 * 2 not started) without anyone ticking a box. The connected-systems panel can
 * change a reading to demonstrate FastPass picking the change up automatically.
 */

import { demoDateOffset } from '../config/demoConfig';
import type { SignalReading } from '../domain/signals';

export const MOCK_SIGNALS: SignalReading[] = [
  {
    key: 'device.enrolled',
    source: 'device-management',
    status: 'blocked',
    detail:
      'Asset Management has not assigned a device yet. Hardware request HRDW-4821 is open and awaiting fulfillment, which also holds up device management enrollment.',
    observedAt: demoDateOffset(-1),
  },
  {
    key: 'teams.channels',
    source: 'collaboration',
    status: 'complete',
    detail: 'Member of 4 of 4 required team and guild channels since Sep 2.',
    observedAt: demoDateOffset(-6),
  },
  {
    key: 'calendar.manager-intro',
    source: 'calendar',
    status: 'not-started',
    detail: 'No introductory meeting with the manager is on the calendar yet.',
    observedAt: null,
  },
  {
    key: 'device.devtools',
    source: 'device-management',
    status: 'complete',
    detail: 'Required toolchain (editor, SDKs, CLIs, container runtime) reported present on Sep 5.',
    observedAt: demoDateOffset(-3),
  },
  {
    key: 'access.engineering',
    source: 'access-management',
    status: 'in-progress',
    detail:
      'Access request ACC-1180 submitted Sep 4. Repo access granted; pipeline and staging still pending approver.',
    observedAt: demoDateOffset(-1),
  },
  {
    key: 'lms.security',
    source: 'learning',
    status: 'complete',
    detail: 'Security Awareness module passed with knowledge check on Sep 4.',
    observedAt: demoDateOffset(-4),
  },
  {
    key: 'lms.compliance',
    source: 'learning',
    status: 'complete',
    detail: 'Compliance Fundamentals completed and code of conduct acknowledged Sep 6.',
    observedAt: demoDateOffset(-2),
  },
  {
    key: 'wiki.standards',
    source: 'knowledge-base',
    status: 'in-progress',
    detail: 'Engineering Standards Handbook opened; 2 of 6 sections viewed, last on Sep 6.',
    observedAt: demoDateOffset(-2),
  },
  {
    key: 'wiki.home',
    source: 'knowledge-base',
    status: 'complete',
    detail: 'Engineering Wiki home, architecture overview, and 3 runbooks viewed by Sep 5.',
    observedAt: demoDateOffset(-3),
  },
  {
    key: 'calendar.checkin',
    source: 'calendar',
    status: 'not-started',
    detail: 'First structured manager check-in is not yet scheduled.',
    observedAt: null,
  },
];

export function cloneMockSignals(): SignalReading[] {
  return MOCK_SIGNALS.map((signal) => ({ ...signal }));
}

/** Default detail text when a signal is changed from the demo panel. */
export function defaultSignalDetail(status: SignalReading['status'], sourceLabel: string): string {
  switch (status) {
    case 'complete':
      return `${sourceLabel} reported this as complete.`;
    case 'in-progress':
      return `${sourceLabel} reports activity in progress.`;
    case 'blocked':
      return `${sourceLabel} reports this is blocked and needs attention.`;
    case 'not-started':
    default:
      return `${sourceLabel} has no activity to report yet.`;
  }
}
