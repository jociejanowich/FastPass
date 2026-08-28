import { Caption1, Card, Divider, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { RiskCard as RiskCardData } from '../../domain/profileAnalysis';
import { formatDate, formatDueRelative } from '../../utils/date';
import { SectionCard } from '../SectionCard';
import { EmptyState } from '../StateViews';
import { Bullets, LabeledBlock, RiskBadge } from './primitives';

const useStyles = makeStyles({
  intro: { color: tokens.colorNeutralForeground2, marginBottom: tokens.spacingVerticalM },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 1080px)': { gridTemplateColumns: '1fr' },
  },
  card: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    borderTopWidth: '3px',
    borderTopStyle: 'solid',
  },
  cardHigh: { borderTopColor: tokens.colorPaletteRedBorderActive },
  cardMedium: { borderTopColor: tokens.colorPaletteYellowBorderActive },
  cardLow: { borderTopColor: tokens.colorPaletteGreenBorderActive },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
  },
  headText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  taskName: {
    display: 'block',
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase400,
  },
  due: { color: tokens.colorNeutralForeground3 },
  why: { color: tokens.colorNeutralForeground2 },
  support: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
  },
});

function RiskDetailCard({ risk }: { risk: RiskCardData }): JSX.Element {
  const styles = useStyles();
  const border =
    risk.level === 'High'
      ? styles.cardHigh
      : risk.level === 'Medium'
        ? styles.cardMedium
        : styles.cardLow;

  return (
    <Card
      className={`${styles.card} ${border}`}
      role="group"
      aria-label={`${risk.level} risk: ${risk.taskName}`}
    >
      <div className={styles.head}>
        <div className={styles.headText}>
          <Text className={styles.taskName}>{risk.taskName}</Text>
          <Caption1 className={styles.due}>
            {risk.dueDate
              ? `Due ${formatDate(risk.dueDate)} · ${formatDueRelative(risk.dueDate)}`
              : 'No due date'}
          </Caption1>
        </div>
        <RiskBadge level={risk.level} />
      </div>

      <LabeledBlock label="Why this was flagged">
        <Text size={300} className={styles.why}>
          {risk.rationale}
        </Text>
      </LabeledBlock>

      <LabeledBlock label="Shared components">
        <Bullets items={risk.sharedComponents} />
      </LabeledBlock>

      <Divider />

      <LabeledBlock label="Recommended next steps">
        <Bullets items={risk.nextSteps} />
      </LabeledBlock>

      <LabeledBlock label="Learning plan">
        <Bullets items={risk.learningPlan} />
      </LabeledBlock>

      <LabeledBlock label="Support">
        <Text size={200} className={styles.support}>
          {risk.support}
        </Text>
      </LabeledBlock>
    </Card>
  );
}

export function UpcomingRisksSection({ risks }: { risks: RiskCardData[] }): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard
      title="🎯 Focused Learning & Upcoming Risks"
      subtitle="Upcoming tasks that resemble earlier blockers or delays, ranked by potential risk"
    >
      <Text size={300} className={styles.intro}>
        These are potential risks based on patterns in this employee&rsquo;s onboarding history —
        not predictions that any task will go wrong. Each card pairs the risk with concrete
        preparation.
      </Text>
      {risks.length === 0 ? (
        <EmptyState
          title="No elevated risks detected"
          description="Upcoming tasks don't strongly resemble any task that has been blocked or delayed so far."
        />
      ) : (
        <div className={styles.grid}>
          {risks.map((risk) => (
            <RiskDetailCard key={risk.taskName} risk={risk} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
