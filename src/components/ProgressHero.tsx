import { Card, ProgressBar, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { EmployeeViewModel } from '../domain/selectors';
import { StatusBadge } from './StatusBadge';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  topRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  percent: {
    fontSize: '48px',
    fontWeight: tokens.fontWeightBold,
    lineHeight: '1',
    color: tokens.colorBrandForeground1,
  },
  meta: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  label: { color: tokens.colorNeutralForeground3 },
  explain: { color: tokens.colorNeutralForeground2 },
});

export interface ProgressHeroProps {
  employee: EmployeeViewModel;
}

export function ProgressHero({ employee }: ProgressHeroProps): JSX.Element {
  const styles = useStyles();
  const { progressPercentage, journeyStatus, currentMilestone, readiness } = employee;

  const explanation = readiness.ready
    ? 'All required tasks are complete. This employee is ready for production work.'
    : `${readiness.tasksRemaining} required task${
        readiness.tasksRemaining === 1 ? '' : 's'
      } remaining before onboarding is complete.`;

  return (
    <Card className={styles.card} role="group" aria-label="Onboarding progress">
      <div className={styles.topRow}>
        <div>
          <Text className={styles.label} size={200}>
            Onboarding progress
          </Text>
          <div className={styles.percent}>{progressPercentage}%</div>
        </div>
        <StatusBadge status={journeyStatus} />
      </div>

      <ProgressBar
        value={progressPercentage}
        max={100}
        thickness="large"
        aria-label={`Onboarding ${progressPercentage} percent complete`}
      />

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <Text className={styles.label} size={200}>
            Current milestone
          </Text>
          <Text weight="semibold">{currentMilestone}</Text>
        </div>
        <div className={styles.metaItem}>
          <Text className={styles.label} size={200}>
            Journey status
          </Text>
          <Text weight="semibold">{journeyStatus}</Text>
        </div>
      </div>

      <Text size={300} className={styles.explain}>
        {explanation}
      </Text>
    </Card>
  );
}
