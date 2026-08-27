import { Button, Caption1, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  ArrowRightRegular,
  CheckmarkCircleFilled,
  ClockFilled,
  CircleRegular,
  DismissCircleFilled,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { BlockerCallout } from '../components/BlockerCallout';
import { EmployeeContextBar } from '../components/EmployeeContextBar';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { ProgressHero } from '../components/ProgressHero';
import { RecommendedTaskCard } from '../components/RecommendedTaskCard';
import { SectionCard } from '../components/SectionCard';
import { ErrorState, LoadingState, SuccessState } from '../components/StateViews';
import { palette } from '../theme/tokens';
import { useAppActions, useAppState } from '../state/appHooks';
import { useBlockers, useEmployeeViewModel, useRecommendedSteps } from '../state/derivedHooks';

const useStyles = makeStyles({
  grid: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: tokens.spacingVerticalL,
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
  infoList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  infoRow: { display: 'flex', justifyContent: 'space-between', gap: tokens.spacingHorizontalM },
  infoLabel: { color: tokens.colorNeutralForeground3 },
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
    '@media (max-width: 480px)': { gridTemplateColumns: '1fr' },
  },
  recommendations: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export function DashboardPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { status, error } = useAppState();
  const { load } = useAppActions();
  const employee = useEmployeeViewModel();
  const recommendations = useRecommendedSteps(2);
  const blockers = useBlockers();

  if (status === 'loading' || status === 'idle') {
    return <LoadingState />;
  }
  if (status === 'error' || !employee) {
    return (
      <ErrorState
        title="We couldn't load your dashboard"
        description={error ?? 'No employee profile is available.'}
        onRetry={() => void load()}
      />
    );
  }

  const { employee: profile, counts } = employee;

  return (
    <div className={styles.grid}>
      <PageHeader
        title={`Welcome, ${profile.displayName}`}
        subtitle={`${profile.role} · ${profile.department} · ${profile.team}`}
        crumbs={[{ label: 'FastPass' }, { label: 'Dashboard' }]}
        actions={
          <Button
            appearance="secondary"
            icon={<ArrowClockwiseRegular />}
            onClick={() => void load()}
          >
            Refresh
          </Button>
        }
      />

      <EmployeeContextBar employee={employee} />

      <div className={styles.twoCol}>
        <ProgressHero employee={employee} />
        <SectionCard title="Employee information">
          <div className={styles.infoList}>
            {[
              ['Employee ID', profile.employeeId],
              ['Role', profile.role],
              ['Department', profile.department],
              ['Team', profile.team],
              ['Manager', profile.managerName],
            ].map(([label, value]) => (
              <div key={label} className={styles.infoRow}>
                <Caption1 className={styles.infoLabel}>{label}</Caption1>
                <Caption1>{value}</Caption1>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className={styles.kpis}>
        <MetricCard
          label="Completed"
          value={counts.Completed}
          accentColor={palette.success}
          icon={<CheckmarkCircleFilled />}
        />
        <MetricCard
          label="In Progress"
          value={counts['In Progress']}
          accentColor={palette.warning}
          icon={<ClockFilled />}
        />
        <MetricCard
          label="Not Started"
          value={counts['Not Started']}
          accentColor={palette.textSecondary}
          icon={<CircleRegular />}
        />
        <MetricCard
          label="Blocked"
          value={counts.Blocked}
          accentColor={palette.blocked}
          icon={<DismissCircleFilled />}
        />
      </div>

      {blockers.length > 0 ? (
        <SectionCard
          title="Needs attention"
          subtitle="Blockers are escalated to your manager automatically."
        >
          {blockers.map((blocker) => (
            <BlockerCallout key={blocker.task.id} blocker={blocker} />
          ))}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Recommended next steps"
        subtitle="Blocked work first, then in-progress, then not started — soonest due date wins."
        action={
          <Button
            appearance="subtle"
            icon={<ArrowRightRegular />}
            iconPosition="after"
            onClick={() => navigate('/tasks')}
          >
            View all tasks
          </Button>
        }
      >
        {recommendations.length === 0 ? (
          <SuccessState
            title="You're all caught up"
            description="Every task is complete. You're ready for production work."
            action={
              <Button appearance="primary" onClick={() => navigate('/career')}>
                See what's next
              </Button>
            }
          />
        ) : (
          <div className={styles.recommendations}>
            {recommendations.map((step, index) => (
              <RecommendedTaskCard key={step.task.id} step={step} rank={index + 1} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
