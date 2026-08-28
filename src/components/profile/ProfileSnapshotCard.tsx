import {
  Avatar,
  Caption1,
  Card,
  ProgressBar,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { RoleContext } from '../../domain/profileAnalysis';
import type { EmployeeViewModel } from '../../domain/selectors';
import { StatusBadge } from '../StatusBadge';
import { Bullets } from './primitives';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalL,
    display: 'grid',
    gridTemplateColumns: '1.15fr 1fr',
    gap: tokens.spacingHorizontalXL,
    '@media (max-width: 860px)': { gridTemplateColumns: '1fr' },
  },
  identity: { display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start' },
  identityText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  name: { fontWeight: tokens.fontWeightBold },
  facts: {
    marginTop: tokens.spacingVerticalM,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalXS,
  },
  factLabel: { color: tokens.colorNeutralForeground3 },
  progressWrap: {
    marginTop: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  roleCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  roleTitle: { fontWeight: tokens.fontWeightSemibold },
  roleSummary: { color: tokens.colorNeutralForeground2 },
  roleLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
});

export interface ProfileSnapshotCardProps {
  employee: EmployeeViewModel;
  roleContext: RoleContext;
}

export function ProfileSnapshotCard({
  employee,
  roleContext,
}: ProfileSnapshotCardProps): JSX.Element {
  const styles = useStyles();
  const p = employee.employee;

  return (
    <Card className={styles.card} role="group" aria-label="Profile snapshot">
      <div>
        <div className={styles.identity}>
          <Avatar name={p.displayName} size={48} color="colorful" />
          <div className={styles.identityText}>
            <Text size={500} className={styles.name}>
              {p.displayName}
            </Text>
            <Caption1>{p.role}</Caption1>
            <StatusBadge status={employee.journeyStatus} size="small" />
          </div>
        </div>

        <div className={styles.facts}>
          <Caption1 className={styles.factLabel}>Department</Caption1>
          <Caption1>{p.department}</Caption1>
          <Caption1 className={styles.factLabel}>Team</Caption1>
          <Caption1>{p.team}</Caption1>
          <Caption1 className={styles.factLabel}>Manager</Caption1>
          <Caption1>{p.managerName}</Caption1>
          <Caption1 className={styles.factLabel}>Current milestone</Caption1>
          <Caption1>{employee.currentMilestone}</Caption1>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressTop}>
            <Caption1 className={styles.factLabel}>Onboarding progress</Caption1>
            <Text weight="semibold">{employee.progressPercentage}%</Text>
          </div>
          <ProgressBar
            value={employee.progressPercentage}
            max={100}
            thickness="large"
            aria-label={`Onboarding ${employee.progressPercentage} percent complete`}
          />
        </div>
      </div>

      <div className={styles.roleCard}>
        <Text size={300} className={styles.roleTitle}>
          {roleContext.role}
          {roleContext.team ? ` · ${roleContext.team}` : ''}
        </Text>
        <Text size={200} className={styles.roleSummary}>
          {roleContext.summary}
        </Text>
        <span className={styles.roleLabel}>Typical activities for this role</span>
        <Bullets items={roleContext.typicalActivities} />
      </div>
    </Card>
  );
}
