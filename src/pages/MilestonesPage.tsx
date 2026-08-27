import { Card, ProgressBar, Text, makeStyles, tokens } from '@fluentui/react-components';
import { RocketRegular } from '@fluentui/react-icons';
import { MilestoneAccordion } from '../components/MilestoneAccordion';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/StateViews';
import { calculateReadiness } from '../domain/businessRules';
import { MILESTONE_ORDER } from '../data/mockData';
import { palette } from '../theme/tokens';
import { useAppActions, useAppState } from '../state/appHooks';
import { useMilestoneViewModels } from '../state/derivedHooks';

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  accordion: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  readiness: {
    padding: tokens.spacingVerticalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    borderTopWidth: '3px',
    borderTopStyle: 'solid',
  },
  headRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM },
  icon: { fontSize: '24px', display: 'inline-flex' },
  metaRow: { display: 'flex', gap: tokens.spacingHorizontalXL, flexWrap: 'wrap' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  label: { color: tokens.colorNeutralForeground3 },
});

export function MilestonesPage(): JSX.Element {
  const styles = useStyles();
  const { status, error, tasks } = useAppState();
  const { load } = useAppActions();
  const milestones = useMilestoneViewModels();

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error') {
    return <ErrorState description={error ?? undefined} onRetry={() => void load()} />;
  }

  const ordered = MILESTONE_ORDER.map((id) =>
    milestones.find((milestone) => milestone.id === id),
  ).filter((milestone): milestone is NonNullable<typeof milestone> => milestone != null);

  const readiness = calculateReadiness(tasks);
  const readinessAccent = readiness.ready ? palette.success : palette.brandPrimary;

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Milestone summary"
        subtitle="Each milestone rolls up its tasks. Status follows the milestone rules: any blocked task blocks the milestone."
        crumbs={[{ label: 'FastPass' }, { label: 'Milestones' }]}
      />

      {ordered.length === 0 ? (
        <EmptyState
          title="No milestones defined"
          description="Milestones will appear here once they are configured for this role."
        />
      ) : (
        <div className={styles.accordion}>
          <MilestoneAccordion milestones={ordered} />
        </div>
      )}

      <Card
        className={styles.readiness}
        style={{ borderTopColor: readinessAccent }}
        role="group"
        aria-label="Ready for production work"
      >
        <div className={styles.headRow}>
          <span className={styles.icon} style={{ color: readinessAccent }}>
            <RocketRegular />
          </span>
          <Text as="h2" size={500} weight="semibold">
            {readiness.label}
          </Text>
        </div>

        {readiness.ready ? (
          <SuccessState
            title="Ready for production work"
            description="Every required onboarding task is complete."
          />
        ) : (
          <>
            <ProgressBar
              value={readiness.progressPercentage}
              max={100}
              thickness="large"
              aria-label={`${readiness.progressPercentage} percent of required tasks complete`}
            />
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <Text size={200} className={styles.label}>
                  Overall progress
                </Text>
                <Text weight="semibold">{readiness.progressPercentage}%</Text>
              </div>
              <div className={styles.metaItem}>
                <Text size={200} className={styles.label}>
                  Tasks remaining
                </Text>
                <Text weight="semibold">{readiness.tasksRemaining}</Text>
              </div>
            </div>
            <Text size={300} className={styles.label}>
              &ldquo;Ready for Production Work&rdquo; unlocks when every required task is completed.
            </Text>
          </>
        )}
      </Card>
    </div>
  );
}
