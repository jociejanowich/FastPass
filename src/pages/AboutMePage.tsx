import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowClockwiseRegular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import {
  DevelopmentAreasCard,
  LearningAreasCard,
  PerformanceCard,
  ProfileSummaryCard,
  StrengthsCard,
} from '../components/profile/ProfileCards';
import { CareerDirectionCard, CareerTrajectoryCard } from '../components/profile/CareerCards';
import { ProfileAnalyzing } from '../components/profile/ProfileAnalyzing';
import { ProfileSnapshotCard } from '../components/profile/ProfileSnapshotCard';
import { SkillsSnapshotCard } from '../components/profile/SkillsSnapshotCard';
import { UpcomingRisksSection } from '../components/profile/UpcomingRisks';
import { useAppActions, useAppState } from '../state/appHooks';
import { useEmployeeViewModel } from '../state/derivedHooks';
import { useProfileAnalysis } from '../state/useProfileAnalysis';

const useStyles = makeStyles({
  page: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  columns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    alignItems: 'start',
    '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' },
  },
  column: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
});

export function AboutMePage(): JSX.Element {
  const styles = useStyles();
  const { status, error } = useAppState();
  const { load } = useAppActions();
  const employee = useEmployeeViewModel();
  const { state: analysis, reload } = useProfileAnalysis();

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error' || !employee) {
    return (
      <ErrorState
        title="We couldn't load your profile"
        description={error ?? 'No employee profile is available.'}
        onRetry={() => void load()}
      />
    );
  }

  const canReanalyze = analysis.status === 'ready' || analysis.status === 'error';

  return (
    <div className={styles.page}>
      <PageHeader
        title="About Me"
        subtitle="A personalized development profile — strengths, growth areas, career direction, and upcoming risks — generated from your onboarding activity."
        crumbs={[{ label: 'FastPass' }, { label: 'About Me' }]}
        actions={
          canReanalyze ? (
            <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={reload}>
              Re-analyze
            </Button>
          ) : undefined
        }
      />

      {analysis.status === 'analyzing' || analysis.status === 'idle' ? (
        <ProfileAnalyzing />
      ) : analysis.status === 'error' ? (
        <ErrorState
          title="Analysis unavailable"
          description={`${analysis.message} You can try again.`}
          onRetry={reload}
        />
      ) : (
        <>
          <ProfileSnapshotCard employee={employee} roleContext={analysis.analysis.roleContext} />

          <div className={styles.columns}>
            <div className={styles.column}>
              <ProfileSummaryCard summary={analysis.analysis.profileSummary} />
              <StrengthsCard items={analysis.analysis.strengths} />
              <DevelopmentAreasCard items={analysis.analysis.developmentAreas} />
              <PerformanceCard summary={analysis.analysis.performanceSummary} />
            </div>
            <div className={styles.column}>
              <SkillsSnapshotCard snapshot={analysis.analysis.skillsSnapshot} />
              <LearningAreasCard items={analysis.analysis.learningAreas} />
              <CareerDirectionCard directions={analysis.analysis.careerDirections} />
              <CareerTrajectoryCard trajectory={analysis.analysis.careerTrajectory} />
            </div>
          </div>

          <UpcomingRisksSection risks={analysis.analysis.upcomingRisks} />
        </>
      )}
    </div>
  );
}
