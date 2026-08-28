import { Badge, Caption1, Switch, Text, makeStyles, tokens } from '@fluentui/react-components';
import { MailRegular } from '@fluentui/react-icons';
import { useCallback, useState } from 'react';
import type { ManagerDashboard } from '../../domain/managerView';
import { demoNow } from '../../config/demoConfig';
import { formatDate } from '../../utils/date';
import { SectionCard } from '../SectionCard';

const STORAGE_KEY = 'fastpass:weekly-digest';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  meta: { color: tokens.colorNeutralForeground3 },
  preview: {
    marginTop: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  previewHead: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  previewBody: {
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  line: { display: 'flex', gap: tokens.spacingHorizontalS },
  lineName: { fontWeight: tokens.fontWeightSemibold, minWidth: '120px' },
});

function nextMondayLabel(): string {
  const d = demoNow();
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const add = (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return formatDate(d.toISOString());
}

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function WeeklyDigestCard({ dashboard }: { dashboard: ManagerDashboard }): JSX.Element {
  const styles = useStyles();
  const [enabled, setEnabled] = useState(readEnabled);

  const toggle = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      /* storage unavailable */
    }
  }, []);

  const { totals } = dashboard;

  return (
    <SectionCard
      title="Weekly summary email"
      subtitle="The dashboard covers day-to-day visibility. A Monday digest is still handy for a quick catch-up."
    >
      <div className={styles.row}>
        <div>
          <Text size={300}>
            {enabled
              ? `On — next send ${nextMondayLabel()}, to ${dashboard.managerName}`
              : 'Off — you will rely on the dashboard only'}
          </Text>
          <br />
          <Caption1 className={styles.meta}>
            Blocker alerts are no longer sent as email — they appear in “Needs your attention”
            above.
          </Caption1>
        </div>
        <Switch
          checked={enabled}
          onChange={(_, data) => toggle(data.checked)}
          label={enabled ? 'Enabled' : 'Disabled'}
        />
      </div>

      {enabled ? (
        <div className={styles.preview}>
          <div className={styles.previewHead}>
            <MailRegular />
            <Text size={200} weight="semibold">
              Preview — Team onboarding, week of {nextMondayLabel()}
            </Text>
          </div>
          <div className={styles.previewBody}>
            <Text size={300}>
              {totals.reports} onboarding · {totals.averageProgress}% average progress ·{' '}
              {totals.needAttention} need attention · {totals.blocked} blocked ·{' '}
              {totals.overdueTasks} overdue {totals.overdueTasks === 1 ? 'task' : 'tasks'}
            </Text>
            {dashboard.reports.map((report) => (
              <div key={report.employee.employeeId} className={styles.line}>
                <Text size={200} className={styles.lineName}>
                  {report.employee.displayName}
                </Text>
                <Text size={200} className={styles.meta}>
                  {report.headline}
                </Text>
              </div>
            ))}
            {dashboard.attention.length > 0 ? (
              <Badge appearance="tint" color="warning" style={{ alignSelf: 'flex-start' }}>
                {dashboard.attention.length} open{' '}
                {dashboard.attention.length === 1 ? 'item' : 'items'} in the attention queue
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
