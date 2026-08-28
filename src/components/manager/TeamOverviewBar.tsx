import { Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowTrendingLinesRegular,
  CalendarClockRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  PeopleTeamRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import type { ReactNode } from 'react';
import type { TeamTotals } from '../../domain/managerView';
import { palette } from '../../theme/tokens';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 1100px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
    '@media (max-width: 560px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
  },
  tile: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    minHeight: '92px',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  label: { color: tokens.colorNeutralForeground3 },
  value: { fontWeight: tokens.fontWeightBold, lineHeight: '1' },
  icon: { fontSize: '18px', color: tokens.colorNeutralForeground3, display: 'inline-flex' },
});

interface Tile {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export function TeamOverviewBar({ totals }: { totals: TeamTotals }): JSX.Element {
  const styles = useStyles();
  const tiles: Tile[] = [
    {
      label: 'Direct reports',
      value: totals.reports,
      icon: <PeopleTeamRegular />,
      color: palette.brandPrimary,
    },
    {
      label: 'Need attention',
      value: totals.needAttention,
      icon: <WarningRegular />,
      color: totals.needAttention > 0 ? palette.warning : palette.textSecondary,
    },
    {
      label: 'Blocked',
      value: totals.blocked,
      icon: <DismissCircleRegular />,
      color: totals.blocked > 0 ? palette.blocked : palette.textSecondary,
    },
    {
      label: 'Overdue tasks',
      value: totals.overdueTasks,
      icon: <CalendarClockRegular />,
      color: totals.overdueTasks > 0 ? palette.blocked : palette.textSecondary,
    },
    {
      label: 'Avg. progress',
      value: `${totals.averageProgress}%`,
      icon: <ArrowTrendingLinesRegular />,
      color: palette.brandPrimary,
    },
    {
      label: 'Ready for work',
      value: `${totals.reports - totals.notYetReady}/${totals.reports}`,
      icon: <CheckmarkCircleRegular />,
      color: palette.success,
    },
  ];

  return (
    <div className={styles.grid} role="group" aria-label="Team overview">
      {tiles.map((tile) => (
        <Card key={tile.label} className={styles.tile} style={{ borderLeftColor: tile.color }}>
          <div className={styles.head}>
            <Text size={200} className={styles.label}>
              {tile.label}
            </Text>
            <span className={styles.icon} aria-hidden="true">
              {tile.icon}
            </span>
          </div>
          <Text size={700} className={styles.value}>
            {tile.value}
          </Text>
        </Card>
      ))}
    </div>
  );
}
