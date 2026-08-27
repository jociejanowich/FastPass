/**
 * Demo data set for FastPass.
 *
 * This is the single source of truth for the demo. A future
 * DataverseFastPassRepository would produce the same shapes from live tables.
 * All dates are derived from the centralized demo date in demoConfig.
 */

import { DEMO_EMPLOYEE_ID, demoDateOffset } from '../config/demoConfig';
import type { Employee, EmployeeTask, Milestone, MilestoneId, Resource } from '../domain/types';

/* -------------------------------------------------------------------------- */
/* Resources                                                                   */
/* -------------------------------------------------------------------------- */

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-it-portal',
    name: 'IT Equipment Portal',
    description:
      'Track hardware requests, check fulfillment status, and request a loaner device while you wait.',
    type: 'Portal',
    url: 'https://contoso.sharepoint.com/sites/it/equipment',
    relatedTaskNames: ['Setup Laptop'],
  },
  {
    id: 'res-access-guide',
    name: 'Access Request Guide',
    description:
      'Step-by-step guide to requesting repository, pipeline, and environment access for engineering.',
    type: 'Article',
    url: 'https://contoso.sharepoint.com/sites/engineering/access-guide',
    relatedTaskNames: ['Request Required Access'],
  },
  {
    id: 'res-eng-standards',
    name: 'Engineering Standards Handbook',
    description: 'Coding standards, review expectations, branching model, and definition of done.',
    type: 'Wiki',
    url: 'https://contoso.sharepoint.com/sites/engineering/standards',
    relatedTaskNames: ['Read Engineering Standards'],
  },
  {
    id: 'res-eng-wiki',
    name: 'Engineering Wiki Home',
    description: 'Team architecture overview, service catalog, and runbooks.',
    type: 'Wiki',
    url: 'https://contoso.sharepoint.com/sites/engineering/wiki',
    relatedTaskNames: ['Review Engineering Wiki'],
  },
  {
    id: 'res-security-training',
    name: 'Security Awareness Training',
    description: 'Required annual security training module and knowledge check.',
    type: 'Video',
    url: 'https://contoso.sharepoint.com/sites/learning/security-training',
    relatedTaskNames: ['Complete Security Training'],
  },
  {
    id: 'res-compliance-training',
    name: 'Compliance Fundamentals',
    description: 'Data handling, records retention, and code of conduct training.',
    type: 'Checklist',
    url: 'https://contoso.sharepoint.com/sites/learning/compliance',
    relatedTaskNames: ['Complete Compliance Training'],
  },
  {
    id: 'res-teams-directory',
    name: 'Teams Channels Directory',
    description: 'Directory of team, guild, and social channels to join in your first week.',
    type: 'Portal',
    url: 'https://contoso.sharepoint.com/sites/it/teams-directory',
    relatedTaskNames: ['Join Teams Channels'],
  },
  {
    id: 'res-manager-1on1',
    name: 'First 1:1 Conversation Guide',
    description: 'Suggested agenda and questions for your first conversations with your manager.',
    type: 'Article',
    url: 'https://contoso.sharepoint.com/sites/people/first-1on1',
    relatedTaskNames: ['Meet Manager', 'First Manager Check-In'],
  },
];

/* -------------------------------------------------------------------------- */
/* Tasks                                                                       */
/* -------------------------------------------------------------------------- */

export const MOCK_TASKS: EmployeeTask[] = [
  {
    id: 'task-setup-laptop',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Setup Laptop',
    description:
      'Receive your assigned device, complete first boot, and enroll it in device management.',
    status: 'Blocked',
    dueDate: demoDateOffset(-6),
    completedDate: null,
    blockerFlag: true,
    blockerDescription:
      'Asset Management has not assigned a device yet. Hardware request HRDW-4821 is open and awaiting fulfillment, which also holds up device management enrollment.',
    required: true,
    category: 'Account Setup',
    recommendedResourceId: 'res-it-portal',
  },
  {
    id: 'task-join-teams',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Join Teams Channels',
    description: 'Join your team, guild, and onboarding Teams channels.',
    status: 'Completed',
    dueDate: demoDateOffset(-6),
    completedDate: demoDateOffset(-6),
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Account Setup',
    recommendedResourceId: 'res-teams-directory',
  },
  {
    id: 'task-meet-manager',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Meet Manager',
    description: 'Hold your first introductory meeting with your manager.',
    status: 'Not Started',
    dueDate: demoDateOffset(2),
    completedDate: null,
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Account Setup',
    recommendedResourceId: 'res-manager-1on1',
  },
  {
    id: 'task-install-dev-tools',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Install Development Tools',
    description: 'Install the editor, SDKs, CLIs, and container runtime used by the team.',
    status: 'Completed',
    dueDate: demoDateOffset(-4),
    completedDate: demoDateOffset(-3),
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Tool Access & Setup',
    recommendedResourceId: null,
  },
  {
    id: 'task-request-access',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Request Required Access',
    description:
      'Request access to source repositories, the CI/CD pipeline, and the staging environment.',
    status: 'In Progress',
    dueDate: demoDateOffset(1),
    completedDate: null,
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Tool Access & Setup',
    recommendedResourceId: 'res-access-guide',
  },
  {
    id: 'task-security-training',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Complete Security Training',
    description: 'Complete the required security awareness module and knowledge check.',
    status: 'Completed',
    dueDate: demoDateOffset(-3),
    completedDate: demoDateOffset(-4),
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Training & Compliance',
    recommendedResourceId: 'res-security-training',
  },
  {
    id: 'task-compliance-training',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Complete Compliance Training',
    description: 'Complete compliance fundamentals training and acknowledge the code of conduct.',
    status: 'Completed',
    dueDate: demoDateOffset(-2),
    completedDate: demoDateOffset(-2),
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Training & Compliance',
    recommendedResourceId: 'res-compliance-training',
  },
  {
    id: 'task-read-eng-standards',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Read Engineering Standards',
    description: 'Read the engineering standards handbook and note questions for your team.',
    status: 'In Progress',
    dueDate: demoDateOffset(4),
    completedDate: null,
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Team Integration',
    recommendedResourceId: 'res-eng-standards',
  },
  {
    id: 'task-review-eng-wiki',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'Review Engineering Wiki',
    description: 'Skim the team wiki: architecture overview, service catalog, and runbooks.',
    status: 'Completed',
    dueDate: demoDateOffset(-3),
    completedDate: demoDateOffset(-3),
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Team Integration',
    recommendedResourceId: 'res-eng-wiki',
  },
  {
    id: 'task-first-manager-checkin',
    employeeId: DEMO_EMPLOYEE_ID,
    name: 'First Manager Check-In',
    description: 'Hold your first structured check-in to review progress and blockers.',
    status: 'Not Started',
    dueDate: demoDateOffset(7),
    completedDate: null,
    blockerFlag: false,
    blockerDescription: null,
    required: true,
    category: 'Team Integration',
    recommendedResourceId: 'res-manager-1on1',
  },
];

/* -------------------------------------------------------------------------- */
/* Milestones                                                                  */
/* -------------------------------------------------------------------------- */

export const MOCK_MILESTONES: Milestone[] = [
  {
    id: 'account-setup',
    name: 'Account Setup',
    description: 'Get your identity, device, and communication channels ready.',
    taskNames: ['Setup Laptop', 'Join Teams Channels', 'Meet Manager'],
  },
  {
    id: 'tool-access',
    name: 'Tool Access & Setup',
    description: 'Install the tools and request the access you need to contribute.',
    taskNames: ['Install Development Tools', 'Request Required Access'],
  },
  {
    id: 'training-compliance',
    name: 'Training & Compliance',
    description: 'Complete the required security and compliance training.',
    taskNames: ['Complete Security Training', 'Complete Compliance Training'],
  },
  {
    id: 'team-integration',
    name: 'Team Integration',
    description: 'Learn how the team works and establish a rhythm with your manager.',
    taskNames: ['Read Engineering Standards', 'Review Engineering Wiki', 'First Manager Check-In'],
  },
];

export const MILESTONE_ORDER: readonly MilestoneId[] = [
  'account-setup',
  'tool-access',
  'training-compliance',
  'team-integration',
];

/* -------------------------------------------------------------------------- */
/* Employee                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The stored employee record. `progressPercentage`, `journeyStatus`, and
 * `currentMilestone` here are only a starting snapshot; the app always shows
 * values derived live from task state via domain selectors.
 */
export const MOCK_EMPLOYEE: Employee = {
  id: 'emp-guid-0001',
  employeeId: DEMO_EMPLOYEE_ID,
  displayName: 'Cesar Martinez',
  role: 'Junior Software Engineer',
  department: 'IT',
  team: 'Software Development',
  managerName: 'Priya Anand',
  journeyStatus: 'In Progress',
  progressPercentage: 50,
  currentMilestone: 'Account Setup',
  startDate: demoDateOffset(-7),
  lastActivityDate: demoDateOffset(-1),
};

export function cloneMockTasks(): EmployeeTask[] {
  return MOCK_TASKS.map((task) => ({ ...task }));
}

export function cloneMockEmployee(): Employee {
  return { ...MOCK_EMPLOYEE };
}
