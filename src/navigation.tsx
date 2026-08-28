import {
  ArrowTrendingLinesRegular,
  HomeRegular,
  PeopleTeamRegular,
  PersonStarRegular,
  SparkleRegular,
  TaskListSquareLtrRegular,
  FlagRegular,
} from '@fluentui/react-icons';
import type { ReactNode } from 'react';
import type { ViewerRole } from './domain/types';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
  description: string;
}

/** The employee onboarding experience. */
export const EMPLOYEE_NAV: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <HomeRegular />,
    description: 'Your onboarding at a glance',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    path: '/tasks',
    icon: <TaskListSquareLtrRegular />,
    description: 'Everything to do, grouped by status',
  },
  {
    key: 'assistant',
    label: 'FastPass Assistant',
    path: '/assistant',
    icon: <SparkleRegular />,
    description: 'Contextual guidance from your live state',
  },
  {
    key: 'milestones',
    label: 'Milestones',
    path: '/milestones',
    icon: <FlagRegular />,
    description: 'Milestone rollup and readiness',
  },
  {
    key: 'career',
    label: 'Career Journey',
    path: '/career',
    icon: <ArrowTrendingLinesRegular />,
    description: 'What comes after onboarding',
  },
  {
    key: 'about',
    label: 'About Me',
    path: '/about',
    icon: <PersonStarRegular />,
    description: 'Your AI-generated development profile',
  },
];

/** The manager workspace — a separate experience, not a section of the above. */
export const MANAGER_NAV: NavItem[] = [
  {
    key: 'team',
    label: 'Team onboarding',
    path: '/team',
    icon: <PeopleTeamRegular />,
    description: 'Progress, blockers, and risks across your direct reports',
  },
];

export function navItemsForRole(role: ViewerRole): NavItem[] {
  return role === 'manager' ? MANAGER_NAV : EMPLOYEE_NAV;
}

export function homePathForRole(role: ViewerRole): string {
  return role === 'manager' ? '/team' : '/dashboard';
}

export function workspaceLabelForRole(role: ViewerRole): string {
  return role === 'manager' ? 'Manager workspace' : 'Onboarding';
}
