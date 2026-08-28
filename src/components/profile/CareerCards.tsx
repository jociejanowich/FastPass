import { Badge, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons';
import type { CareerDirection, CareerTrajectory } from '../../domain/profileAnalysis';
import { SectionCard } from '../SectionCard';
import { Bullets, LabeledBlock } from './primitives';

const useStyles = makeStyles({
  directionList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  direction: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
    borderRadius: `0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0`,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  path: { fontWeight: tokens.fontWeightSemibold },
  why: { color: tokens.colorNeutralForeground2 },
  disclaimer: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  ladder: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  step: { display: 'flex', flexDirection: 'column', gap: '3px' },
  stepLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
  current: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase400 },
  roleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  roleChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
});

export function CareerDirectionCard({
  directions,
}: {
  directions: CareerDirection[];
}): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard
      title="🚀 Career Direction"
      subtitle="Possible paths based on current evidence — not a prediction"
    >
      <div className={styles.directionList}>
        {directions.map((direction, index) => (
          <div key={index} className={styles.direction}>
            <LabeledBlock label="Career direction">
              <Text size={300} className={styles.path}>
                {direction.path}
              </Text>
            </LabeledBlock>
            <LabeledBlock label="Why it fits">
              <Text size={300} className={styles.why}>
                {direction.whyItFits}
              </Text>
            </LabeledBlock>
            <LabeledBlock label="Skills to develop">
              <Bullets items={direction.skillsToDevelop} />
            </LabeledBlock>
          </div>
        ))}
      </div>
      <Caption1 className={styles.disclaimer}>
        These are directions the current evidence is consistent with. They are not guaranteed and
        will shift as more work is completed.
      </Caption1>
    </SectionCard>
  );
}

export function CareerTrajectoryCard({
  trajectory,
}: {
  trajectory: CareerTrajectory;
}): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard
      title="📈 Career Trajectory"
      subtitle="A developmental progression, not a timeline"
    >
      <div className={styles.ladder}>
        <div className={styles.step}>
          <span className={styles.stepLabel}>Current</span>
          <Text className={styles.current}>{trajectory.current}</Text>
        </div>
        <div className={styles.step}>
          <span className={styles.stepLabel}>Near-term development</span>
          <Text size={300}>{trajectory.nearTerm}</Text>
        </div>
        <div className={styles.step}>
          <span className={styles.stepLabel}>Next-step roles</span>
          <div className={styles.roleRow}>
            {trajectory.nextStepRoles.map((role) => (
              <Badge key={role} appearance="tint" color="brand" className={styles.roleChip}>
                <ArrowRightRegular fontSize={12} aria-hidden="true" />
                {role}
              </Badge>
            ))}
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepLabel}>Longer-term possibilities</span>
          <div className={styles.roleRow}>
            {trajectory.longerTerm.map((role) => (
              <Badge key={role} appearance="outline" color="informative">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
