import { Card, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import { isAutoDetected } from '../domain/detection';
import type { RecommendedStep } from '../domain/selectors';
import { useSignalLookup } from '../state/derivedHooks';
import { formatDate, formatDueRelative } from '../utils/date';
import { DetectionBadge } from './DetectionBadge';
import { ResourceLink } from './ResourceLink';
import { StatusBadge } from './StatusBadge';
import { TaskStatusMenu } from './TaskStatusMenu';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  headRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
  },
  name: { fontWeight: tokens.fontWeightSemibold },
  label: { color: tokens.colorNeutralForeground3 },
  reason: { color: tokens.colorNeutralForeground2 },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
});

export interface RecommendedTaskCardProps {
  step: RecommendedStep;
  rank: number;
}

export function RecommendedTaskCard({ step, rank }: RecommendedTaskCardProps): JSX.Element {
  const styles = useStyles();
  const lookupSignal = useSignalLookup();
  const { task, reason, resource } = step;
  const auto = isAutoDetected(task.name);
  return (
    <Card className={styles.card} role="group" aria-label={`Recommendation ${rank}: ${task.name}`}>
      <div className={styles.headRow}>
        <div>
          <Caption1 className={styles.label}>Recommendation {rank}</Caption1>
          <Text block className={styles.name}>
            {task.name}
          </Text>
        </div>
        <StatusBadge status={task.status} size="small" />
      </div>

      <Caption1 className={styles.label}>
        {task.dueDate
          ? `Due ${formatDate(task.dueDate)} · ${formatDueRelative(task.dueDate)}`
          : 'No due date'}
      </Caption1>

      <Text size={300} className={styles.reason}>
        {reason}
      </Text>

      <div className={styles.footer}>
        {resource ? <ResourceLink resource={resource} prefix="Start with" /> : <span />}
        {auto ? (
          <DetectionBadge taskName={task.name} reading={lookupSignal(task.name)} />
        ) : (
          <TaskStatusMenu taskId={task.id} status={task.status} />
        )}
      </div>
    </Card>
  );
}
