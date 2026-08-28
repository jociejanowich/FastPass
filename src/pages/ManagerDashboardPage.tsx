import { makeStyles, tokens } from '@fluentui/react-components';
import { readyReports } from '../domain/managerView';
import { ErrorState, LoadingState, SuccessState } from '../components/StateViews';
import { SectionCard } from '../components/SectionCard';
import { AttentionQueue } from '../components/manager/AttentionQueue';
import { ManagerAccessRequired } from '../components/manager/ManagerAccessRequired';
import { ManagerWorkspaceHeader } from '../components/manager/ManagerWorkspaceHeader';
import { TeamOverviewBar } from '../components/manager/TeamOverviewBar';
import { TeamRoster } from '../components/manager/TeamRoster';
import { WeeklyDigestCard } from '../components/manager/WeeklyDigestCard';
import { useAppState } from '../state/appHooks';
import { useManagerDashboard } from '../state/useManagerDashboard';

const useStyles = makeStyles({
  page: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
});

export function ManagerDashboardPage(): JSX.Element {
  const styles = useStyles();
  const { viewer } = useAppState();
  const { state, reload } = useManagerDashboard();

  if (viewer.role !== 'manager') {
    return <ManagerAccessRequired />;
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return <LoadingState label="Loading your team…" />;
  }
  if (state.status === 'error') {
    return (
      <ErrorState title="We couldn't load your team" description={state.message} onRetry={reload} />
    );
  }

  const { dashboard } = state;
  const ready = readyReports(dashboard);

  return (
    <div className={styles.page}>
      <ManagerWorkspaceHeader
        managerName={dashboard.managerName}
        reportCount={dashboard.totals.reports}
        generatedAt={dashboard.generatedAt}
        onRefresh={reload}
      />

      <TeamOverviewBar totals={dashboard.totals} />

      <AttentionQueue items={dashboard.attention} />

      {ready.length > 0 ? (
        <SectionCard title="Ready for production work">
          <SuccessState
            title={`${ready.length} ${ready.length === 1 ? 'report has' : 'reports have'} finished every required task`}
            description={ready.map((r) => r.employee.displayName).join(', ')}
          />
        </SectionCard>
      ) : null}

      <TeamRoster reports={dashboard.reports} />

      <WeeklyDigestCard dashboard={dashboard} />
    </div>
  );
}
