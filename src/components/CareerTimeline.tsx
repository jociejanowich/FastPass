import { Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import { CheckmarkCircleFilled, CircleFilled, CircleRegular } from '@fluentui/react-icons';
import { palette } from '../theme/tokens';

export type CareerStageStatus = 'Completed' | 'Current' | 'Upcoming' | 'Future';

export interface CareerStage {
  key: string;
  title: string;
  status: CareerStageStatus;
  timeframe: string;
  detail: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: 0,
    position: 'relative',
    '@media (max-width: 900px)': { flexDirection: 'column' },
  },
  stage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `0 ${tokens.spacingHorizontalS}`,
    position: 'relative',
    '@media (max-width: 900px)': {
      flexDirection: 'row',
      alignItems: 'flex-start',
      textAlign: 'left',
      gap: tokens.spacingHorizontalM,
      padding: `${tokens.spacingVerticalS} 0`,
    },
  },
  connector: {
    position: 'absolute',
    top: '13px',
    left: '50%',
    width: '100%',
    height: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
    zIndex: 0,
    '@media (max-width: 900px)': {
      top: 0,
      left: '13px',
      width: '2px',
      height: '100%',
    },
  },
  marker: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 1,
    fontSize: '24px',
    flexShrink: 0,
  },
  body: {
    marginTop: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    '@media (max-width: 900px)': { marginTop: 0 },
  },
  title: { fontWeight: tokens.fontWeightSemibold },
  timeframe: { color: tokens.colorNeutralForeground3 },
  detail: { color: tokens.colorNeutralForeground2, maxWidth: '22ch' },
});

const STATUS_META: Record<CareerStageStatus, { color: string; icon: JSX.Element; label: string }> =
  {
    Completed: {
      color: palette.success,
      icon: <CheckmarkCircleFilled style={{ color: palette.success }} />,
      label: 'Completed',
    },
    Current: {
      color: palette.brandPrimary,
      icon: <CircleFilled style={{ color: palette.brandPrimary }} />,
      label: 'Current',
    },
    Upcoming: {
      color: palette.neutralFuture,
      icon: <CircleRegular style={{ color: palette.neutralFuture }} />,
      label: 'Upcoming',
    },
    Future: {
      color: palette.neutralFuture,
      icon: <CircleRegular style={{ color: palette.neutralFuture }} />,
      label: 'Future',
    },
  };

export interface CareerTimelineProps {
  stages: CareerStage[];
}

export function CareerTimeline({ stages }: CareerTimelineProps): JSX.Element {
  const styles = useStyles();
  return (
    <ol className={styles.root} aria-label="Career journey timeline">
      {stages.map((stage, index) => {
        const meta = STATUS_META[stage.status];
        return (
          <li key={stage.key} className={styles.stage}>
            {index < stages.length - 1 ? (
              <span className={styles.connector} aria-hidden="true" />
            ) : null}
            <span className={styles.marker} aria-hidden="true">
              {meta.icon}
            </span>
            <span className={styles.body}>
              <Text className={styles.title}>{stage.title}</Text>
              <Caption1 className={styles.timeframe}>
                {meta.label} · {stage.timeframe}
              </Caption1>
              <Caption1 className={styles.detail}>{stage.detail}</Caption1>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
