import {
  Badge,
  Caption1,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { isAutoDetected } from '../domain/detection';
import type { EmployeeTask } from '../domain/types';
import { formatDate, formatDueRelative, isOverdue } from '../utils/date';
import { useResourceLookup, useSignalLookup } from '../state/derivedHooks';
import { DetectionBadge } from './DetectionBadge';
import { ResourceLink } from './ResourceLink';
import { StatusBadge } from './StatusBadge';
import { TaskStatusMenu } from './TaskStatusMenu';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  main: { flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  titleLine: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  name: { fontWeight: tokens.fontWeightSemibold },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightRegular,
  },
  meta: { color: tokens.colorNeutralForeground3 },
  overdue: { color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold },
  detected: { color: tokens.colorNeutralForeground3, fontStyle: 'italic' },
  blocker: {
    color: tokens.colorPaletteRedForeground1,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusSmall,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
  actions: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: tokens.spacingVerticalXS,
  },
});

export interface TaskRowProps {
  task: EmployeeTask;
}

export function TaskRow({ task }: TaskRowProps): JSX.Element {
  const styles = useStyles();
  const lookupResource = useResourceLookup();
  const lookupSignal = useSignalLookup();
  const resource = lookupResource(task.recommendedResourceId);
  const reading = lookupSignal(task.name);
  const auto = isAutoDetected(task.name);
  const completed = task.status === 'Completed';
  const overdue = !completed && isOverdue(task.dueDate);

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <div className={styles.titleLine}>
          <Text className={mergeClasses(styles.name, completed && styles.nameCompleted)}>
            {task.name}
          </Text>
          {task.required ? (
            <Badge appearance="outline" size="small" color="informative">
              Required
            </Badge>
          ) : (
            <Badge appearance="outline" size="small" color="subtle">
              Optional
            </Badge>
          )}
        </div>

        <Caption1 className={mergeClasses(styles.meta, overdue && styles.overdue)}>
          {completed
            ? `Completed ${formatDate(task.completedDate ?? task.dueDate)}`
            : task.dueDate
              ? `Due ${formatDate(task.dueDate)} · ${formatDueRelative(task.dueDate)}`
              : 'No due date'}
        </Caption1>

        {!completed ? (
          <Text size={200} className={styles.meta}>
            {task.description}
          </Text>
        ) : null}

        {task.status === 'Blocked' && task.blockerDescription ? (
          <Text size={200} className={styles.blocker}>
            Blocked: {task.blockerDescription}
          </Text>
        ) : auto && reading && !completed ? (
          <Text size={200} className={styles.detected}>
            Detected: {reading.detail}
          </Text>
        ) : null}

        {resource ? <ResourceLink resource={resource} prefix="Related resource" /> : null}
      </div>

      <div className={styles.actions}>
        {auto ? (
          <>
            <StatusBadge status={task.status} size="small" />
            <DetectionBadge taskName={task.name} reading={reading} />
          </>
        ) : (
          <TaskStatusMenu taskId={task.id} status={task.status} />
        )}
      </div>
    </div>
  );
}
