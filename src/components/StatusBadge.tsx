import { Badge } from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  ClockFilled,
  CircleRegular,
  DismissCircleFilled,
} from '@fluentui/react-icons';
import type { MilestoneStatus, TaskStatus } from '../domain/types';

type AnyStatus = TaskStatus | MilestoneStatus;

type BadgeColor = 'success' | 'warning' | 'danger' | 'informative';

interface StatusMeta {
  color: BadgeColor;
  icon: JSX.Element;
  label: string;
}

const META: Record<AnyStatus, StatusMeta> = {
  Completed: { color: 'success', icon: <CheckmarkCircleFilled />, label: 'Completed' },
  Complete: { color: 'success', icon: <CheckmarkCircleFilled />, label: 'Complete' },
  'In Progress': { color: 'warning', icon: <ClockFilled />, label: 'In Progress' },
  'Not Started': { color: 'informative', icon: <CircleRegular />, label: 'Not Started' },
  Blocked: { color: 'danger', icon: <DismissCircleFilled />, label: 'Blocked' },
};

export interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Status indicator that always pairs an icon and a text label with color, so
 * status is never communicated by color alone.
 */
export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps): JSX.Element {
  const meta = META[status];
  return (
    <Badge
      appearance="tint"
      color={meta.color}
      size={size}
      icon={meta.icon}
      aria-label={`Status: ${meta.label}`}
    >
      {meta.label}
    </Badge>
  );
}
