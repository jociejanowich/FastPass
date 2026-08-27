import { Badge, Tooltip } from '@fluentui/react-components';
import { PlugConnectedRegular } from '@fluentui/react-icons';
import { getDetectionRule } from '../domain/detection';
import { SIGNAL_SOURCE_LABEL, type SignalReading } from '../domain/signals';

export interface DetectionBadgeProps {
  taskName: string;
  reading: SignalReading | null;
}

/**
 * Shows that a task's status is detected automatically, and from which system.
 * Replaces the manual status control for auto-detected tasks.
 */
export function DetectionBadge({ taskName, reading }: DetectionBadgeProps): JSX.Element | null {
  const rule = getDetectionRule(taskName);
  if (!rule) return null;

  const label = SIGNAL_SOURCE_LABEL[rule.source];
  const tooltip = reading?.detail
    ? `Detected from ${label}: ${reading.detail}`
    : `Status is detected automatically from ${label}.`;

  return (
    <Tooltip content={tooltip} relationship="description">
      <Badge appearance="outline" color="informative" icon={<PlugConnectedRegular />}>
        Auto · {label}
      </Badge>
    </Tooltip>
  );
}
