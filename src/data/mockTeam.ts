/**
 * Additional direct reports for the manager (Team) dashboard.
 *
 * Each member uses the same ten canonical onboarding tasks (so milestones,
 * progress, readiness, blockers, and risk analysis all work unchanged), with
 * member-specific status, dates, blockers, and notes. Cesar Martinez — the
 * signed-in employee — is composed in by the repository from live state.
 */

import { demoDateOffset } from '../config/demoConfig';
import type { Employee, EmployeeTask, TaskStatus } from '../domain/types';
import { MOCK_TASKS } from './mockData';

interface TaskShape {
  name: string;
  description: string;
  required: boolean;
  category: string;
  recommendedResourceId: string | null;
}

const TASK_SHAPES: TaskShape[] = MOCK_TASKS.map((task) => ({
  name: task.name,
  description: task.description,
  required: task.required,
  category: task.category,
  recommendedResourceId: task.recommendedResourceId,
}));

interface TaskSpec {
  status: TaskStatus;
  /** Due date offset in days from the member's start date. */
  dueOffset: number;
  /** Completed date offset in days from start (only for Completed). */
  doneOffset?: number;
  blockerDescription?: string;
  notes?: string;
}

interface MemberSpec {
  employee: Omit<Employee, 'journeyStatus' | 'progressPercentage' | 'currentMilestone'>;
  /** Days between the member's start date and the demo "today". */
  startedDaysAgo: number;
  /** Per-task overrides, keyed by task name. Missing => Not Started, due +7. */
  tasks: Partial<Record<string, TaskSpec>>;
}

function buildMemberTasks(spec: MemberSpec): EmployeeTask[] {
  const startOffset = -spec.startedDaysAgo;
  return TASK_SHAPES.map((shape, index) => {
    const t = spec.tasks[shape.name] ?? { status: 'Not Started' as TaskStatus, dueOffset: 7 };
    const blocked = t.status === 'Blocked';
    return {
      id: `${spec.employee.employeeId.toLowerCase()}-task-${index}`,
      employeeId: spec.employee.employeeId,
      name: shape.name,
      description: shape.description,
      status: t.status,
      dueDate: demoDateOffset(startOffset + t.dueOffset),
      completedDate:
        t.status === 'Completed'
          ? demoDateOffset(startOffset + (t.doneOffset ?? t.dueOffset))
          : null,
      blockerFlag: blocked,
      blockerDescription: blocked ? (t.blockerDescription ?? 'Blocked and awaiting action.') : null,
      required: shape.required,
      category: shape.category,
      recommendedResourceId: shape.recommendedResourceId,
      notes: t.notes ?? null,
    };
  });
}

const MEMBER_SPECS: MemberSpec[] = [
  {
    employee: {
      id: 'emp-guid-0002',
      employeeId: 'EMP-014',
      displayName: 'Sam Staudaher',
      role: 'Junior Software Engineer',
      department: 'IT',
      team: 'Software Development',
      managerName: 'Jim McDonnell',
      startDate: demoDateOffset(-16),
      lastActivityDate: demoDateOffset(-1),
    },
    startedDaysAgo: 16,
    tasks: {
      'Setup Laptop': { status: 'Completed', dueOffset: 1, doneOffset: 1 },
      'Join Teams Channels': { status: 'Completed', dueOffset: 1, doneOffset: 1 },
      'Meet Manager': { status: 'Completed', dueOffset: 3, doneOffset: 3 },
      'Install Development Tools': { status: 'Completed', dueOffset: 3, doneOffset: 4 },
      'Request Required Access': { status: 'Completed', dueOffset: 4, doneOffset: 6 },
      'Complete Security Training': { status: 'Completed', dueOffset: 5, doneOffset: 4 },
      'Complete Compliance Training': { status: 'Completed', dueOffset: 6, doneOffset: 6 },
      'Read Engineering Standards': { status: 'Completed', dueOffset: 10, doneOffset: 12 },
      'Review Engineering Wiki': { status: 'Completed', dueOffset: 7, doneOffset: 7 },
      'First Manager Check-In': { status: 'In Progress', dueOffset: 18 },
    },
  },
  {
    employee: {
      id: 'emp-guid-0003',
      employeeId: 'EMP-021',
      displayName: 'Sandra Dcruz',
      role: 'Associate Product Manager',
      department: 'IT',
      team: 'Software Development',
      managerName: 'Jim McDonnell',
      startDate: demoDateOffset(-5),
      lastActivityDate: demoDateOffset(-2),
    },
    startedDaysAgo: 5,
    tasks: {
      'Setup Laptop': { status: 'Completed', dueOffset: 1, doneOffset: 2 },
      'Join Teams Channels': { status: 'Completed', dueOffset: 1, doneOffset: 1 },
      'Meet Manager': { status: 'Not Started', dueOffset: 3 },
      'Install Development Tools': { status: 'In Progress', dueOffset: 4 },
      'Request Required Access': {
        status: 'Blocked',
        dueOffset: 4,
        blockerDescription:
          'Access request APM-2207 was rejected — the analytics workspace needs a second approver above the team lead. Resubmitted; awaiting sign-off.',
        notes: 'Submitted twice now, keeps bouncing back. Not sure who the second approver is.',
      },
      'Complete Security Training': { status: 'Completed', dueOffset: 5, doneOffset: 3 },
      'Complete Compliance Training': { status: 'Not Started', dueOffset: 6 },
      'Read Engineering Standards': { status: 'Not Started', dueOffset: 10 },
      'Review Engineering Wiki': { status: 'Not Started', dueOffset: 7 },
      'First Manager Check-In': { status: 'Not Started', dueOffset: 12 },
    },
  },
  {
    employee: {
      id: 'emp-guid-0004',
      employeeId: 'EMP-030',
      displayName: 'Sanjani Palani',
      role: 'Junior Data Engineer',
      department: 'IT',
      team: 'Software Development',
      managerName: 'Jim McDonnell',
      startDate: demoDateOffset(0),
      lastActivityDate: demoDateOffset(0),
    },
    startedDaysAgo: 0,
    tasks: {
      'Setup Laptop': { status: 'In Progress', dueOffset: 1 },
      'Join Teams Channels': { status: 'In Progress', dueOffset: 1 },
      'Meet Manager': { status: 'Not Started', dueOffset: 3 },
      'Install Development Tools': { status: 'Not Started', dueOffset: 4 },
      'Request Required Access': { status: 'Not Started', dueOffset: 4 },
      'Complete Security Training': { status: 'Not Started', dueOffset: 5 },
      'Complete Compliance Training': { status: 'Not Started', dueOffset: 6 },
      'Read Engineering Standards': { status: 'Not Started', dueOffset: 10 },
      'Review Engineering Wiki': { status: 'Not Started', dueOffset: 7 },
      'First Manager Check-In': { status: 'Not Started', dueOffset: 12 },
    },
  },
];

export function cloneTeamMembers(): { employee: Employee; tasks: EmployeeTask[] }[] {
  return MEMBER_SPECS.map((spec) => {
    const tasks = buildMemberTasks(spec);
    const employee: Employee = {
      ...spec.employee,
      // These three are always shown derived; seed with placeholders.
      journeyStatus: 'In Progress',
      progressPercentage: 0,
      currentMilestone: 'Account Setup',
    };
    return { employee, tasks };
  });
}
