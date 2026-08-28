import { Badge, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';
import type { EvidenceItem, RiskLevel } from '../../domain/profileAnalysis';

const useStyles = makeStyles({
  label: {
    display: 'block',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalXS,
  },
  labeled: { display: 'flex', flexDirection: 'column' },
  bullets: {
    margin: 0,
    paddingLeft: '1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  bulletItem: { lineHeight: tokens.lineHeightBase300 },
  evidenceList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  evidenceItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  evidenceLabel: { fontWeight: tokens.fontWeightSemibold },
  evidenceText: { color: tokens.colorNeutralForeground3 },
});

export function LabeledBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.labeled}>
      <Caption1 as="span" className={styles.label}>
        {label}
      </Caption1>
      {children}
    </div>
  );
}

export function Bullets({ items }: { items: readonly string[] }): JSX.Element {
  const styles = useStyles();
  return (
    <ul className={styles.bullets}>
      {items.map((item, index) => (
        <li key={index} className={styles.bulletItem}>
          <Text size={300}>{item}</Text>
        </li>
      ))}
    </ul>
  );
}

export function EvidenceList({ items }: { items: readonly EvidenceItem[] }): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.evidenceList}>
      {items.map((item, index) => (
        <div key={index} className={styles.evidenceItem}>
          <Text size={300} className={styles.evidenceLabel}>
            {item.label}
          </Text>
          <Caption1 className={styles.evidenceText}>{item.evidence}</Caption1>
        </div>
      ))}
    </div>
  );
}

const RISK_META: Record<
  RiskLevel,
  { color: 'danger' | 'warning' | 'success'; emoji: string; label: string }
> = {
  High: { color: 'danger', emoji: '🔴', label: 'High risk' },
  Medium: { color: 'warning', emoji: '🟠', label: 'Medium risk' },
  Low: { color: 'success', emoji: '🟢', label: 'Low risk' },
};

export function RiskBadge({ level }: { level: RiskLevel }): JSX.Element {
  const meta = RISK_META[level];
  return (
    <Badge
      appearance="tint"
      color={meta.color}
      aria-label={meta.label}
      style={{ whiteSpace: 'nowrap' }}
    >
      <span aria-hidden="true" style={{ marginRight: 4 }}>
        {meta.emoji}
      </span>
      {level.toUpperCase()} RISK
    </Badge>
  );
}
