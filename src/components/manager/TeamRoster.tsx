import {
  Avatar,
  Badge,
  Button,
  Caption1,
  Card,
  ProgressBar,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ChevronRightRegular } from '@fluentui/react-icons';
import { useState } from 'react';
import type { ReportOnboarding, ReportStatus } from '../../domain/managerView';
import { formatDate } from '../../utils/date';
import { SectionCard } from '../SectionCard';
import { StatusBadge } from '../StatusBadge';
import { ReportDetailDrawer } from './ReportDetailDrawer';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
  card: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    borderTopWidth: '3px',
    borderTopStyle: 'solid',
  },
  identity: { display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'center' },
  identityText: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' },
  name: { fontWeight: tokens.fontWeightSemibold },
  sub: { color: tokens.colorNeutralForeground3 },
  headline: { color: tokens.colorNeutralForeground2 },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  chips: { display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap' },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
});

const STATUS_META: Record<
  ReportStatus,
  { label: string; color: 'danger' | 'warning' | 'success' | 'informative'; border: string }
> = {
  blocked: { label: 'Blocked', color: 'danger', border: tokens.colorPaletteRedBorderActive },
  'at-risk': { label: 'At risk', color: 'warning', border: tokens.colorPaletteYellowBorderActive },
  'on-track': { label: 'On track', color: 'success', border: tokens.colorPaletteGreenBorderActive },
  'just-started': {
    label: 'Just started',
    color: 'informative',
    border: tokens.colorNeutralStroke1,
  },
};

function RosterCard({
  report,
  onOpen,
}: {
  report: ReportOnboarding;
  onOpen: () => void;
}): JSX.Element {
  const styles = useStyles();
  const meta = STATUS_META[report.status];

  return (
    <Card className={styles.card} style={{ borderTopColor: meta.border }}>
      <div className={styles.identity}>
        <Avatar name={report.employee.displayName} size={40} color="colorful" />
        <div className={styles.identityText}>
          <Text className={styles.name}>{report.employee.displayName}</Text>
          <Caption1 className={styles.sub}>
            {report.employee.role} · day {report.daysIn}
          </Caption1>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge appearance="filled" color={meta.color}>
            {meta.label}
          </Badge>
        </div>
      </div>

      <Text size={200} className={styles.headline}>
        {report.headline}
      </Text>

      <div className={styles.progressTop}>
        <Caption1 className={styles.sub}>Progress</Caption1>
        <Text size={200} weight="semibold">
          {report.vm.progressPercentage}%
        </Text>
      </div>
      <ProgressBar value={report.vm.progressPercentage} max={100} />

      <div className={styles.chips}>
        <StatusBadge status={report.vm.journeyStatus} size="small" />
        <Badge appearance="tint" color="subtle" size="small">
          {report.vm.currentMilestone}
        </Badge>
        {report.blockers.length > 0 ? (
          <Badge appearance="tint" color="danger" size="small">
            {report.blockers.length} blocker{report.blockers.length === 1 ? '' : 's'}
          </Badge>
        ) : null}
        {report.overdueTasks.length > 0 ? (
          <Badge appearance="tint" color="severe" size="small">
            {report.overdueTasks.length} overdue
          </Badge>
        ) : null}
        {report.highRisks.length > 0 ? (
          <Badge appearance="tint" color="warning" size="small">
            {report.highRisks.length} risk{report.highRisks.length === 1 ? '' : 's'}
          </Badge>
        ) : null}
      </div>

      <div className={styles.footer}>
        <Caption1 className={styles.sub}>
          Last active {formatDate(report.employee.lastActivityDate)}
        </Caption1>
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronRightRegular />}
          iconPosition="after"
          onClick={onOpen}
        >
          View details
        </Button>
      </div>
    </Card>
  );
}

export function TeamRoster({ reports }: { reports: ReportOnboarding[] }): JSX.Element {
  const styles = useStyles();
  const [openId, setOpenId] = useState<string | null>(null);
  const activeReport = reports.find((r) => r.employee.employeeId === openId) ?? null;

  return (
    <SectionCard
      title="Your reports"
      subtitle="Onboarding status for each direct report. Sorted by who needs you most."
    >
      <div className={styles.grid}>
        {reports.map((report) => (
          <RosterCard
            key={report.employee.employeeId}
            report={report}
            onOpen={() => setOpenId(report.employee.employeeId)}
          />
        ))}
      </div>
      <ReportDetailDrawer
        report={activeReport}
        open={activeReport !== null}
        onClose={() => setOpenId(null)}
      />
    </SectionCard>
  );
}
