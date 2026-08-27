import {
  Badge,
  Caption1,
  Card,
  Divider,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { AlertRegular, MailRegular } from '@fluentui/react-icons';
import type { ManagerSummary } from '../domain/types';
import { formatDate, formatDateTime, formatDueRelative } from '../utils/date';

const useStyles = makeStyles({
  card: { padding: 0, overflow: 'hidden' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerAlert: { backgroundColor: tokens.colorPaletteRedBackground1 },
  meta: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    color: tokens.colorNeutralForeground2,
  },
  body: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS,
  },
  list: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  label: { color: tokens.colorNeutralForeground3 },
  blockerItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
});

interface FromLine {
  subject: string;
  to: string;
  generatedAt: string;
}

function MailMeta({ subject, to, generatedAt }: FromLine): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.meta}>
      <Text size={200}>
        <strong>From:</strong> FastPass Orchestration &lt;fastpass@contoso.com&gt;
      </Text>
      <Text size={200}>
        <strong>To:</strong> {to}
      </Text>
      <Text size={200}>
        <strong>Subject:</strong> {subject}
      </Text>
      <Caption1 className={styles.label}>Sent {formatDateTime(generatedAt)}</Caption1>
    </div>
  );
}

export interface ManagerBlockerAlertProps {
  summary: ManagerSummary;
}

export function ManagerBlockerAlert({ summary }: ManagerBlockerAlertProps): JSX.Element {
  const styles = useStyles();

  return (
    <Card className={styles.card} role="group" aria-label="Manager blocker alert preview">
      <div className={`${styles.header} ${styles.headerAlert}`}>
        <AlertRegular />
        <Text weight="semibold">Automated blocker alert</Text>
        <Badge appearance="tint" color="danger">
          {summary.blockers.length} blocker{summary.blockers.length === 1 ? '' : 's'}
        </Badge>
      </div>
      <MailMeta
        to={summary.managerName}
        subject={`Action needed: ${summary.employeeName} is blocked`}
        generatedAt={summary.generatedAt}
      />
      <div className={styles.body}>
        {summary.blockers.length === 0 ? (
          <Text size={300}>No active blockers. No alert would be sent.</Text>
        ) : (
          summary.blockers.map((blocker) => (
            <div key={blocker.taskName} className={styles.blockerItem}>
              <Text size={300} weight="semibold" block>
                {blocker.taskName}
              </Text>
              <Caption1 block className={styles.label}>
                {blocker.dueDate
                  ? `Due ${formatDate(blocker.dueDate)} · ${formatDueRelative(blocker.dueDate)}`
                  : 'No due date'}
              </Caption1>
              <Text size={300} block>
                {blocker.blockerDescription}
              </Text>
              <Text size={300} block>
                <strong>Recommended action:</strong> {blocker.recommendedAction}
              </Text>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export interface ManagerDailySummaryProps {
  summary: ManagerSummary;
}

export function ManagerDailySummary({ summary }: ManagerDailySummaryProps): JSX.Element {
  const styles = useStyles();

  return (
    <Card className={styles.card} role="group" aria-label="Manager daily summary preview">
      <div className={styles.header}>
        <MailRegular />
        <Text weight="semibold">Daily onboarding summary</Text>
      </div>
      <MailMeta
        to={summary.managerName}
        subject={`Daily summary: ${summary.employeeName} — ${summary.progressPercentage}% complete`}
        generatedAt={summary.generatedAt}
      />
      <div className={styles.body}>
        <Text size={300}>
          <strong>{summary.employeeName}</strong> · {summary.role} · {summary.department}
        </Text>
        <Text size={300}>
          Overall progress: <strong>{summary.progressPercentage}%</strong>
        </Text>

        <Caption1 className={styles.sectionLabel}>Blockers</Caption1>
        {summary.blockers.length === 0 ? (
          <Text size={300}>None.</Text>
        ) : (
          <ul className={styles.list}>
            {summary.blockers.map((blocker) => (
              <li key={blocker.taskName}>
                <Text size={300}>
                  {blocker.taskName} — {blocker.blockerDescription}
                </Text>
              </li>
            ))}
          </ul>
        )}

        <Caption1 className={styles.sectionLabel}>Priority tasks</Caption1>
        <ul className={styles.list}>
          {summary.priorityTasks.map((task) => (
            <li key={task.taskName}>
              <Text size={300}>
                {task.taskName} — {task.status}
                {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ''}
              </Text>
            </li>
          ))}
        </ul>

        <Caption1 className={styles.sectionLabel}>
          Completed ({summary.completedTasks.length})
        </Caption1>
        <ul className={styles.list}>
          {summary.completedTasks.map((task) => (
            <li key={task.taskName}>
              <Text size={300}>{task.taskName}</Text>
            </li>
          ))}
        </ul>

        <Divider />
        <Caption1 className={styles.sectionLabel}>Recommended manager actions</Caption1>
        <ul className={styles.list}>
          {summary.blockers.length > 0 ? (
            <li>
              <Text size={300}>
                Help clear {summary.blockers.map((b) => b.taskName).join(', ')} before the due date.
              </Text>
            </li>
          ) : (
            <li>
              <Text size={300}>
                No intervention needed — acknowledge progress at your next 1:1.
              </Text>
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
}
