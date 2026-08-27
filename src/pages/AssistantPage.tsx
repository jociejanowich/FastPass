import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowResetRegular } from '@fluentui/react-icons';
import { AssistantChat } from '../components/AssistantChat';
import { EmployeeContextBar } from '../components/EmployeeContextBar';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { ErrorState, LoadingState } from '../components/StateViews';
import { ManagerBlockerAlert, ManagerDailySummary } from '../components/ManagerEmailPreview';
import { useAppActions, useAppState } from '../state/appHooks';
import { useEmployeeViewModel, useManagerSummary } from '../state/derivedHooks';

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  chatShell: { height: '540px', minHeight: '420px' },
  previews: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
});

export function AssistantPage(): JSX.Element {
  const styles = useStyles();
  const { status, error, assistant } = useAppState();
  const { load, resetAssistant } = useAppActions();
  const employee = useEmployeeViewModel();
  const managerSummary = useManagerSummary();

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error' || !employee) {
    return <ErrorState description={error ?? undefined} onRetry={() => void load()} />;
  }

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="FastPass Assistant"
        subtitle="Contextual guidance from your live onboarding state."
        crumbs={[{ label: 'FastPass' }, { label: 'FastPass Assistant' }]}
        actions={
          assistant.messages.length > 0 ? (
            <Button appearance="subtle" icon={<ArrowResetRegular />} onClick={resetAssistant}>
              Clear conversation
            </Button>
          ) : undefined
        }
      />

      <EmployeeContextBar employee={employee} />

      <div className={styles.chatShell}>
        <AssistantChat />
      </div>

      <SectionCard
        title="What your manager sees"
        subtitle="Manager visibility runs through automated notifications — no separate dashboard to check."
      >
        {managerSummary ? (
          <div className={styles.previews}>
            <ManagerBlockerAlert summary={managerSummary} />
            <ManagerDailySummary summary={managerSummary} />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
