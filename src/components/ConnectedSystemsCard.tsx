import { Badge, Button, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  BookOpenRegular,
  BranchRegular,
  CalendarLtrRegular,
  KeyRegular,
  LaptopRegular,
  PeopleTeamRegular,
  PersonPasskeyRegular,
  BookRegular,
} from '@fluentui/react-icons';
import type { ReactNode } from 'react';
import type { ConnectedSystemViewModel } from '../domain/connectedSystems';
import type { SignalSource } from '../domain/signals';
import { useAppActions, useAppState } from '../state/appHooks';
import { useConnectedSystems, useSignalSummary } from '../state/derivedHooks';
import { formatDateTime } from '../utils/date';
import { SectionCard } from './SectionCard';
import { StatusBadge } from './StatusBadge';

const useStyles = makeStyles({
  summary: { display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
  system: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  systemHead: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  systemName: { fontWeight: tokens.fontWeightSemibold, flexGrow: 1 },
  icon: { display: 'inline-flex', fontSize: '18px', color: tokens.colorNeutralForeground2 },
  signalRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  signalMain: { flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  signalTask: { fontWeight: tokens.fontWeightSemibold },
  detail: { color: tokens.colorNeutralForeground3 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

const SOURCE_ICON: Record<SignalSource, ReactNode> = {
  'device-management': <LaptopRegular />,
  identity: <PersonPasskeyRegular />,
  learning: <BookOpenRegular />,
  'access-management': <KeyRegular />,
  collaboration: <PeopleTeamRegular />,
  calendar: <CalendarLtrRegular />,
  'source-control': <BranchRegular />,
  'knowledge-base': <BookRegular />,
};

function SystemCard({ system }: { system: ConnectedSystemViewModel }): JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.system}>
      <div className={styles.systemHead}>
        <span className={styles.icon} aria-hidden="true">
          {SOURCE_ICON[system.source]}
        </span>
        <Text className={styles.systemName}>{system.label}</Text>
        <Badge
          appearance="tint"
          color={system.hasBlocker ? 'danger' : 'informative'}
          aria-label={`${system.satisfiedCount} of ${system.total} complete`}
        >
          {system.satisfiedCount}/{system.total}
        </Badge>
      </div>

      {system.signals.map((signal) => (
        <div key={signal.key} className={styles.signalRow}>
          <div className={styles.signalMain}>
            <Text size={200} className={styles.signalTask}>
              {signal.taskName}
            </Text>
            <Caption1 className={styles.detail}>
              {signal.reading?.detail ?? 'No reading yet.'}
            </Caption1>
            {signal.reading?.observedAt ? (
              <Caption1 className={styles.detail}>
                Last reported {formatDateTime(signal.reading.observedAt)}
              </Caption1>
            ) : null}
          </div>
          <StatusBadge status={signal.taskStatus} size="small" />
        </div>
      ))}
    </div>
  );
}

export function ConnectedSystemsCard(): JSX.Element {
  const styles = useStyles();
  const systems = useConnectedSystems();
  const summary = useSignalSummary();
  const { lastRefreshed, mutating } = useAppState();
  const { refresh } = useAppActions();

  return (
    <SectionCard
      title="Connected systems"
      subtitle={`Task status is detected automatically from ${summary.connectedCount} connected systems.`}
      action={
        <Button appearance="secondary" onClick={() => void refresh()} disabled={mutating}>
          Check now
        </Button>
      }
    >
      <div className={styles.summary}>
        <Badge appearance="tint" color="success">
          {summary.satisfied} complete
        </Badge>
        <Badge appearance="tint" color="warning">
          {summary.pending} pending
        </Badge>
        <Badge appearance="tint" color="danger">
          {summary.blocked} blocked
        </Badge>
        <Caption1 style={{ color: tokens.colorNeutralForeground3, alignSelf: 'center' }}>
          Last checked {formatDateTime(lastRefreshed)}
        </Caption1>
      </div>

      <div className={styles.grid}>
        {systems.map((system) => (
          <SystemCard key={system.source} system={system} />
        ))}
      </div>
    </SectionCard>
  );
}
