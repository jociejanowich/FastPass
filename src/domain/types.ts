/**
 * Core FastPass domain types.
 *
 * These types are storage-agnostic. The mock repository, and any future
 * Dataverse or Microsoft Graph adapter, must map their payloads onto these
 * shapes so that presentation components never depend on a backend.
 */

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';

export const TASK_STATUSES: readonly TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Completed',
  'Blocked',
] as const;

export type JourneyStatus = 'Not Started' | 'In Progress' | 'Completed';

export type MilestoneId =
  'account-setup' | 'tool-access' | 'training-compliance' | 'team-integration';

export type ResourceType = 'Article' | 'Wiki' | 'Video' | 'Portal' | 'Checklist';

export type MilestoneStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Blocked';

export interface Employee {
  id: string;
  employeeId: string;
  displayName: string;
  role: string;
  department: string;
  team: string;
  managerName: string;
  journeyStatus: JourneyStatus;
  progressPercentage: number;
  currentMilestone: string;
  startDate: string;
  lastActivityDate: string;
}

export interface EmployeeTask {
  id: string;
  employeeId: string;
  name: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  completedDate: string | null;
  blockerFlag: boolean;
  blockerDescription: string | null;
  required: boolean;
  category: string;
  recommendedResourceId: string | null;
  /** Free-text notes the employee left on this task, if any. */
  notes: string | null;
}

export interface Milestone {
  id: MilestoneId;
  name: string;
  description: string;
  taskNames: string[];
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  type: ResourceType;
  url: string;
  relatedTaskNames: string[];
}

export interface ManagerSummary {
  employeeName: string;
  managerName: string;
  role: string;
  department: string;
  progressPercentage: number;
  blockers: ManagerBlockerLine[];
  priorityTasks: ManagerTaskLine[];
  completedTasks: ManagerTaskLine[];
  generatedAt: string;
}

export interface ManagerBlockerLine {
  taskName: string;
  dueDate: string | null;
  blockerDescription: string;
  recommendedAction: string;
}

export interface ManagerTaskLine {
  taskName: string;
  dueDate: string | null;
  status: TaskStatus;
}

/** Who is signed in. Managers see the Team dashboard; employees do not. */
export type ViewerRole = 'employee' | 'manager';

export interface Viewer {
  id: string;
  displayName: string;
  role: ViewerRole;
  jobTitle: string;
}

/** One direct report's full onboarding data, for the manager dashboard. */
export interface TeamMemberOnboarding {
  employee: Employee;
  tasks: EmployeeTask[];
}

export interface TeamOnboarding {
  managerName: string;
  members: TeamMemberOnboarding[];
}
