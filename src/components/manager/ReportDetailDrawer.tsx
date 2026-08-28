import {
  Badge,
  Caption1,
  Divider,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  ProgressBar,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { ReportOnboarding } from '../../domain/managerView';
import { formatDate, formatDateTime, formatDueRelative } from '../../utils/date';
import { BlockerCallout } from '../BlockerCallout';
import { StatusBadge } from '../StatusBadge';

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  sub: { color: tokens.colorNeutralForeground3 },
  section: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  sectionLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalXS} 0`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  rowName: { minWidth: 0 },
  list: {
    margin: 0,
    paddingLeft: '1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  risk: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorPaletteYellowBorderActive}`,
    borderRadius: `0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0`,
    padding: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
});

function managerActions(report: ReportOnboarding): string[] {
  const out: string[] = [];
  for (const blocker of report.blockers) {
    out.push(blocker.recommendedAction);
  }
  for (const task of report.overdueTasks) {
    if (/meet|check-in|manager/i.test(task.name)) {
      out.push(`Put "${task.name}" on the calendar this week.`);
    } else {
      out.push(`Ask about "${task.name}" — it is past its due date.`);
    }
  }
  if (out.length === 0) {
    if (report.status === 'just-started') {
      out.push('Schedule the intro 1:1 and confirm hardware and access requests are moving.');
    } else if (report.vm.readiness.ready) {
      out.push('Confirm they can pick up real work and close out onboarding.');
    } else {
      out.push('No action needed — acknowledge progress at your next 1:1.');
    }
  }
  return [...new Set(out)].slice(0, 4);
}

export interface ReportDetailDrawerProps {
  report: ReportOnboarding | null;
  open: boolean;
  onClose: () => void;
}

export function ReportDetailDrawer({
  report,
  open,
  onClose,
}: ReportDetailDrawerProps): JSX.Element {
  const styles = useStyles();

  return (
    <OverlayDrawer
      position="end"
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
      style={{ maxWidth: '480px', width: '92vw' }}
    >
      <DrawerHeader>
        <DrawerHeaderTitle>{report ? report.employee.displayName : 'Report'}</DrawerHeaderTitle>
      </DrawerHeader>
      {report ? (
        <DrawerBody>
          <div className={styles.body}>
            <div>
              <Caption1 className={styles.sub}>
                {report.employee.role} · {report.employee.department} · {report.employee.team}
              </Caption1>
              <br />
              <Caption1 className={styles.sub}>
                Started {formatDate(report.employee.startDate)} · day {report.daysIn} · last active{' '}
                {formatDateTime(report.employee.lastActivityDate)}
              </Caption1>
            </div>

            <div className={styles.section}>
              <div className={styles.progressTop}>
                <span className={styles.sectionLabel}>Onboarding progress</span>
                <Text weight="semibold">{report.vm.progressPercentage}%</Text>
              </div>
              <ProgressBar value={report.vm.progressPercentage} max={100} thickness="large" />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatusBadge status={report.vm.journeyStatus} size="small" />
                <Caption1 className={styles.sub}>Milestone: {report.vm.currentMilestone}</Caption1>
                <Caption1 className={styles.sub}>
                  {report.vm.readiness.ready
                    ? 'Ready for production work'
                    : `${report.vm.readiness.tasksRemaining} required tasks remaining`}
                </Caption1>
              </div>
            </div>

            {report.blockers.length > 0 ? (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Blockers</span>
                {report.blockers.map((blocker) => (
                  <BlockerCallout key={blocker.task.id} blocker={blocker} />
                ))}
              </div>
            ) : null}

            {report.highRisks.length > 0 ? (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Predicted risks</span>
                {report.highRisks.map((risk) => (
                  <div key={risk.taskName} className={styles.risk}>
                    <Text size={300} weight="semibold">
                      {risk.taskName}
                    </Text>
                    <Caption1 className={styles.sub}>
                      {risk.dueDate
                        ? `Due ${formatDate(risk.dueDate)} · ${formatDueRelative(risk.dueDate)}`
                        : 'No due date'}
                    </Caption1>
                    <Text size={200}>{risk.rationale}</Text>
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Priority tasks</span>
              {report.priorityTasks.length === 0 ? (
                <Caption1 className={styles.sub}>Nothing outstanding.</Caption1>
              ) : (
                report.priorityTasks.map((task) => (
                  <div key={task.id} className={styles.row}>
                    <div className={styles.rowName}>
                      <Text size={300}>{task.name}</Text>
                      <br />
                      <Caption1 className={styles.sub}>
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                      </Caption1>
                    </div>
                    <StatusBadge status={task.status} size="small" />
                  </div>
                ))
              )}
            </div>

            <div className={styles.section}>
              <span className={styles.sectionLabel}>
                Completed ({report.summary.completedTasks.length})
              </span>
              <ul className={styles.list}>
                {report.summary.completedTasks.map((task) => (
                  <li key={task.taskName}>
                    <Text size={200}>{task.taskName}</Text>
                  </li>
                ))}
              </ul>
            </div>

            <Divider />

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Recommended manager actions</span>
              <ul className={styles.list}>
                {managerActions(report).map((action, index) => (
                  <li key={index}>
                    <Text size={300}>{action}</Text>
                  </li>
                ))}
              </ul>
            </div>

            <Badge appearance="tint" color="subtle" style={{ alignSelf: 'flex-start' }}>
              Employee ID {report.employee.employeeId}
            </Badge>
          </div>
        </DrawerBody>
      ) : null}
    </OverlayDrawer>
  );
}
