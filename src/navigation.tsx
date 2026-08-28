import {
  ArrowTrendingLinesRegular,
  HomeRegular,
  PersonStarRegular,
  SparkleRegular,
  TaskListSquareLtrRegular,
  FlagRegular,
} from '@fluentui/react-icons';
import type { ReactNode } from 'react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
  description: string;
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
];
