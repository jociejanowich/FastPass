import { Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minHeight: '104px',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  label: {
    color: tokens.colorNeutralForeground2,
  },
  value: {
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1',
  },
  icon: {
    fontSize: '20px',
    display: 'inline-flex',
    color: tokens.colorNeutralForeground3,
  },
});

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accentColor?: string;
  hint?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  accentColor,
  hint,
}: MetricCardProps): JSX.Element {
  const styles = useStyles();
  return (
    <Card
      className={styles.card}
      style={{ borderLeftColor: accentColor ?? tokens.colorNeutralStroke1 }}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className={styles.header}>
        <Text size={200} className={styles.label}>
          {label}
        </Text>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <Text size={700} className={styles.value}>
        {value}
      </Text>
      {hint ? (
        <Text size={200} className={styles.label}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}
