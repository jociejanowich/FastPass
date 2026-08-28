/**
 * Signed-in identities for the demo.
 *
 * In production the viewer comes from the authenticated session (Microsoft
 * Entra ID); `role` is derived from directory group membership or from having
 * `directReports`. Here it is a simple account switcher.
 */

import type { Viewer } from '../domain/types';

export const EMPLOYEE_VIEWER: Viewer = {
  id: 'emp-guid-0001',
  displayName: 'Cesar Martinez',
  role: 'employee',
  jobTitle: 'Junior Software Engineer',
};

export const MANAGER_VIEWER: Viewer = {
  id: 'mgr-guid-0001',
  displayName: 'Priya Anand',
  role: 'manager',
  jobTitle: 'Engineering Manager',
};

export const DEMO_VIEWERS: Viewer[] = [EMPLOYEE_VIEWER, MANAGER_VIEWER];
