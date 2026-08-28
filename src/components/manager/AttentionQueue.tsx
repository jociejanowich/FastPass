import { Badge, Caption1, Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { AttentionItem } from '../../domain/managerView';
import { formatDate, formatDueRelative } from '../../utils/date';
import { SectionCard } from '../SectionCard';
import { SuccessState } from '../StateViews';

const useStyles = makeStyles({
  list: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  item: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
  },
  itemHigh: { borderLeftColor: tokens.colorPaletteRedBorderActive },
  itemMedium: { borderLeftColor: tokens.colorPaletteYellowBorderActive },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  who: { fontWeight: tokens.fontWeightSemibold },
  task: { color: tokens.colorNeutralForeground2 },
  detail: { color: tokens.colorNeutralForeground2 },
  action: {},
  meta: { color: tokens.colorNeutralForeground3 },
});

const KIND_LABEL: Record<AttentionItem['kind'], string> = {
  blocker: 'Blocker',
  overdue: 'Overdue',
  risk: 'Predicted risk',
};

const KIND_COLOR: Record<AttentionItem['kind'], 'danger' | 'warning' | 'severe'> = {
  blocker: 'danger',
  overdue: 'severe',
  risk: 'warning',
};

function AttentionRow({ item }: { item: AttentionItem }): JSX.Element {
  const styles = useStyles();
  return (
    <Card
      className={`${styles.item} ${item.severity === 'high' ? styles.itemHigh : styles.itemMedium}`}
      role="group"
      aria-label={`${KIND_LABEL[item.kind]} for ${item.employeeName}: ${item.taskName}`}
    >
      <div className={styles.head}>
        <Badge appearance="filled" color={KIND_COLOR[item.kind]}>
          {KIND_LABEL[item.kind]}
        </Badge>
        <Text className={styles.who}>{item.employeeName}</Text>
        <Text className={styles.task}>· {item.taskName}</Text>
      </div>
      <Caption1 className={styles.meta}>
        {item.dueDate
          ? `Due ${formatDate(item.dueDate)} · ${formatDueRelative(item.dueDate)}`
          : 'No due date'}
        {item.daysOpen != null
          ? ` · open ${item.daysOpen} day${item.daysOpen === 1 ? '' : 's'}`
          : ''}
      </Caption1>
      <Text size={300} className={styles.detail}>
        {item.detail}
      </Text>
      <Text size={300} className={styles.action}>
        <strong>What to do:</strong> {item.recommendedAction}
      </Text>
    </Card>
  );
}

export function AttentionQueue({ items }: { items: AttentionItem[] }): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard
      title="Needs your attention"
      subtitle="Everything a blocker alert used to email you — blockers, overdue tasks, and predicted risks across the team, most urgent first"
    >
      {items.length === 0 ? (
        <SuccessState
          title="Nothing needs you right now"
          description="No blockers, no overdue tasks, and no elevated risks across your reports."
        />
      ) : (
        <div className={styles.list}>
          {items.map((item, index) => (
            <AttentionRow key={`${item.employeeId}-${item.taskName}-${index}`} item={item} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
