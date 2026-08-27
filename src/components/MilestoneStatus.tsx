import { Text, makeStyles, tokens } from '@fluentui/react-components';
import type { MilestoneStatus as MilestoneStatusValue } from '../domain/types';

const useStyles = makeStyles({
  root: { display: 'inline-flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },
  emoji: { fontSize: tokens.fontSizeBase300 },
  label: { fontWeight: tokens.fontWeightSemibold },
});

const EMOJI: Record<MilestoneStatusValue, string> = {
  Blocked: '\u{1F6A9}',
  Complete: '✅',
  'In Progress': '\u{1F6A7}',
  'Not Started': '○',
};

/** Theme-aware label colors (readable in both light and dark). */
const COLOR: Record<MilestoneStatusValue, string> = {
  Blocked: tokens.colorPaletteRedForeground1,
  Complete: tokens.colorPaletteGreenForeground1,
  'In Progress': tokens.colorPaletteYellowForeground2,
  'Not Started': tokens.colorNeutralForeground3,
};

export interface MilestoneStatusProps {
  status: MilestoneStatusValue;
}

/** Milestone subtitle: emoji + text label + color. Never color alone. */
export function MilestoneStatus({ status }: MilestoneStatusProps): JSX.Element {
  const styles = useStyles();
  return (
    <span className={styles.root}>
      <span className={styles.emoji} aria-hidden="true">
        {EMOJI[status]}
      </span>
      <Text size={200} className={styles.label} style={{ color: COLOR[status] }}>
        {status}
      </Text>
    </span>
  );
}
