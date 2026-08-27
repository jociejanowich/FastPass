import {
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { BlockerViewModel } from '../domain/selectors';
import { formatDate, formatDueRelative } from '../utils/date';
import { ResourceLink } from './ResourceLink';

const useStyles = makeStyles({
  bar: { marginBottom: tokens.spacingVerticalM },
  body: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  label: { color: tokens.colorNeutralForeground3 },
  dependents: { color: tokens.colorNeutralForeground2 },
});

export interface BlockerCalloutProps {
  blocker: BlockerViewModel;
}

export function BlockerCallout({ blocker }: BlockerCalloutProps): JSX.Element {
  const styles = useStyles();
  const { task, blockerDescription, resource, recommendedAction, dependentTaskNames } = blocker;

  return (
    <MessageBar className={styles.bar} intent="error" layout="multiline">
      <MessageBarBody className={styles.body}>
        <MessageBarTitle>Blocked: {task.name}</MessageBarTitle>
        <Text size={200} className={styles.label}>
          {task.dueDate
            ? `Due ${formatDate(task.dueDate)} · ${formatDueRelative(task.dueDate)}`
            : 'No due date'}
        </Text>
        <Text size={300}>{blockerDescription}</Text>
        <Text size={300}>
          <strong>Recommended action:</strong> {recommendedAction}
        </Text>
        {dependentTaskNames.length > 0 ? (
          <Text size={200} className={styles.dependents}>
            Depends on this: {dependentTaskNames.join(', ')}
          </Text>
        ) : null}
      </MessageBarBody>
      {resource ? (
        <MessageBarActions>
          <ResourceLink resource={resource} prefix="Open" />
        </MessageBarActions>
      ) : null}
    </MessageBar>
  );
}
