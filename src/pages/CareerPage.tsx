import { Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import { LightbulbRegular } from '@fluentui/react-icons';
import { CareerTimeline, type CareerStage } from '../components/CareerTimeline';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { useEmployeeViewModel } from '../state/derivedHooks';

const STAGES: CareerStage[] = [
  {
    key: 'onboarding',
    title: 'Onboarding Complete',
    status: 'Completed',
    timeframe: 'Day 1–30',
    detail: 'Access, tooling, training, and team integration finished.',
  },
  {
    key: 'role-readiness',
    title: 'Role Readiness',
    status: 'Current',
    timeframe: 'Day 30–60',
    detail: 'Ramp on the codebase and ship small changes with review.',
  },
  {
    key: 'first-project',
    title: 'First Project Contribution',
    status: 'Upcoming',
    timeframe: 'Day 60–90',
    detail: 'Own a feature slice end to end on a real project.',
  },
  {
    key: 'certification',
    title: 'Engineering Certification',
    status: 'Future',
    timeframe: '6 months',
    detail: 'Complete the internal engineering certification path.',
  },
  {
    key: 'career-growth',
    title: 'Career Growth',
    status: 'Future',
    timeframe: '12+ months',
    detail: 'Move toward the next level with a development plan.',
  },
];

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  timelineCard: { padding: tokens.spacingVerticalXXL },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
  list: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  label: { color: tokens.colorNeutralForeground3 },
});

export function CareerPage(): JSX.Element {
  const styles = useStyles();
  const employee = useEmployeeViewModel();
  const blockerCount = employee?.blockerCount ?? 0;

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Career Journey"
        subtitle="Where onboarding leads next — your development path over the first year."
        crumbs={[{ label: 'FastPass' }, { label: 'Career Journey' }]}
      />

      <Card className={styles.timelineCard}>
        <CareerTimeline stages={STAGES} />
      </Card>

      <div className={styles.twoCol}>
        <SectionCard title="Role-based guidance" subtitle="Software Engineer pathway">
          <ul className={styles.list}>
            <li>
              <Text>Role-specific learning — language, framework, and platform depth.</Text>
            </li>
            <li>
              <Text>First project contribution — own a feature slice with mentorship.</Text>
            </li>
            <li>
              <Text>Certification preparation — internal engineering certification path.</Text>
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="Readiness outlook" action={<LightbulbRegular fontSize={20} />}>
          <Text>
            FastPass watches onboarding signals for risk to later milestones. An unresolved access
            request or incomplete role-based learning can delay the First Project Contribution
            stage.
          </Text>
          <Text className={styles.label} size={200}>
            {blockerCount > 0
              ? `${blockerCount} open blocker is affecting this outlook.`
              : 'No open blockers — the next stage is on track.'}
          </Text>
          <Text>
            <strong>Recommended:</strong> resolve access and complete role-based learning before
            project assignment.
          </Text>
        </SectionCard>
      </div>
    </div>
  );
}
