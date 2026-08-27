import { Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { EmployeeViewModel } from '../domain/selectors';
import { StatusBadge } from './StatusBadge';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXL,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXL,
    alignItems: 'center',
  },
  item: { display: 'flex', flexDirection: 'column', gap: '2px' },
  label: { color: tokens.colorNeutralForeground3 },
  value: { fontWeight: tokens.fontWeightSemibold },
});

export interface EmployeeContextBarProps {
  employee: EmployeeViewModel;
}

export function EmployeeContextBar({ employee }: EmployeeContextBarProps): JSX.Element {
  const styles = useStyles();
  return (
    <section className={styles.root} aria-label="Employee context">
      <div className={styles.item}>
        <Caption1 className={styles.label}>Employee</Caption1>
        <Text className={styles.value}>{employee.employee.displayName}</Text>
      </div>
      <div className={styles.item}>
        <Caption1 className={styles.label}>Progress</Caption1>
        <Text className={styles.value}>{employee.progressPercentage}%</Text>
      </div>
      <div className={styles.item}>
        <Caption1 className={styles.label}>Journey status</Caption1>
        <StatusBadge status={employee.journeyStatus} size="small" />
      </div>
      <div className={styles.item}>
        <Caption1 className={styles.label}>Current milestone</Caption1>
        <Text className={styles.value}>{employee.currentMilestone}</Text>
      </div>
      <div className={styles.item}>
        <Caption1 className={styles.label}>Blockers</Caption1>
        <Text className={styles.value}>{employee.blockerCount}</Text>
      </div>
    </section>
  );
}
