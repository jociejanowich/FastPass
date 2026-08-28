import { Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { EvidenceItem, LearningArea } from '../../domain/profileAnalysis';
import { SectionCard } from '../SectionCard';
import { EvidenceList } from './primitives';

const useStyles = makeStyles({
  prose: { color: tokens.colorNeutralForeground1, lineHeight: tokens.lineHeightBase400 },
  learningList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  learningItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  learningTopic: { fontWeight: tokens.fontWeightSemibold },
  learningReason: { color: tokens.colorNeutralForeground3 },
});

export function ProfileSummaryCard({ summary }: { summary: string }): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard title="👤 About Me" subtitle="AI-generated professional profile">
      <Text size={300} className={styles.prose}>
        {summary}
      </Text>
    </SectionCard>
  );
}

export function StrengthsCard({ items }: { items: EvidenceItem[] }): JSX.Element {
  return (
    <SectionCard title="✅ Areas of Strength" subtitle="Demonstrated through onboarding activity">
      <EvidenceList items={items} />
    </SectionCard>
  );
}

export function DevelopmentAreasCard({ items }: { items: EvidenceItem[] }): JSX.Element {
  return (
    <SectionCard title="⚠️ Development Areas" subtitle="Where more practice or support would help">
      <EvidenceList items={items} />
    </SectionCard>
  );
}

export function PerformanceCard({ summary }: { summary: string }): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard title="📊 Overall Performance">
      <Text size={300} className={styles.prose}>
        {summary}
      </Text>
    </SectionCard>
  );
}

export function LearningAreasCard({ items }: { items: LearningArea[] }): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard title="📚 Areas to Learn" subtitle="Skills and topics to develop next, and why">
      <div className={styles.learningList}>
        {items.map((item, index) => (
          <div key={index} className={styles.learningItem}>
            <Text size={300} className={styles.learningTopic}>
              {item.topic}
            </Text>
            <Caption1 className={styles.learningReason}>{item.reason}</Caption1>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
