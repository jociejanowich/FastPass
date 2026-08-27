import {
  Badge,
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { LightbulbRegular, SparkleRegular } from '@fluentui/react-icons';
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
  takeaway: {
    padding: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
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
        subtitle="A conceptual look at how FastPass extends past onboarding into a connected employee journey."
        crumbs={[{ label: 'FastPass' }, { label: 'Career Journey' }]}
        badge={
          <Badge appearance="tint" color="brand" icon={<SparkleRegular />}>
            Future Capability
          </Badge>
        }
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

        <SectionCard
          title="Proactive insight"
          subtitle="Conceptual — not a live prediction"
          action={<LightbulbRegular fontSize={20} />}
        >
          <Text>
            In a future release, FastPass could watch onboarding signals and flag risk to later
            milestones. For example, an unresolved access request or incomplete role-based learning
            during onboarding could delay the First Project Contribution stage.
          </Text>
          <Text className={styles.label} size={200}>
            {blockerCount > 0
              ? `Illustrative: this employee currently has ${blockerCount} blocker, which is the kind of signal that would feed such a prediction.`
              : 'Illustrative: with no current blockers, a prediction model would show low risk to the next stage.'}
          </Text>
          <Text>
            <strong>Possible recommended intervention:</strong> resolve access and complete
            role-based learning before project assignment.
          </Text>
        </SectionCard>
      </div>

      <MessageBar intent="info" layout="multiline">
        <MessageBarBody>
          <MessageBarTitle>Leadership takeaway</MessageBarTitle>
          FastPass can evolve from onboarding coordination into a connected employee journey
          platform.
        </MessageBarBody>
      </MessageBar>
    </div>
  );
}
