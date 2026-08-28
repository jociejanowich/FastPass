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
  /** When set, only viewers with this role see the item. */
  requiresRole?: ViewerRole;
}

export const NAV_ITEMS: NavItem[] = [
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
  {
    key: 'team',
    label: 'Team',
    path: '/team',
    icon: <PeopleTeamRegular />,
    description: 'Onboarding progress and blockers across your reports',
    requiresRole: 'manager',
  },
];

export function navItemsForRole(role: ViewerRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.requiresRole || item.requiresRole === role);
}
