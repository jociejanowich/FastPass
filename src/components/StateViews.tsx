import { Button, Spinner, Text, makeStyles, tokens } from '@fluentui/react-components';
import { CheckmarkCircleFilled, ErrorCircleRegular, MailInboxRegular } from '@fluentui/react-icons';
import type { ReactNode } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
    minHeight: '160px',
  },
  icon: {
    fontSize: '32px',
    display: 'inline-flex',
  },
  success: { color: tokens.colorPaletteGreenForeground1 },
  error: { color: tokens.colorPaletteRedForeground1 },
  neutral: { color: tokens.colorNeutralForeground3 },
  body: { color: tokens.colorNeutralForeground2, maxWidth: '420px' },
});

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.container} role="status">
      <span className={`${styles.icon} ${styles.neutral}`}>{icon ?? <MailInboxRegular />}</span>
      <Text weight="semibold" size={400}>
        {title}
      </Text>
      {description ? (
        <Text size={300} className={styles.body}>
          {description}
        </Text>
      ) : null}
      {action}
    </div>
  );
}

export interface SuccessStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SuccessState({ title, description, action }: SuccessStateProps): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.container} role="status">
      <span className={`${styles.icon} ${styles.success}`}>
        <CheckmarkCircleFilled />
      </span>
      <Text weight="semibold" size={400}>
        {title}
      </Text>
      {description ? (
        <Text size={300} className={styles.body}>
          {description}
        </Text>
      ) : null}
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Please try again.',
  onRetry,
}: ErrorStateProps): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.container} role="alert">
      <span className={`${styles.icon} ${styles.error}`}>
        <ErrorCircleRegular />
      </span>
      <Text weight="semibold" size={400}>
        {title}
      </Text>
      <Text size={300} className={styles.body}>
        {description}
      </Text>
      {onRetry ? (
        <Button appearance="primary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = 'Loading your onboarding data…',
}: LoadingStateProps): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <Spinner label={label} />
    </div>
  );
}
