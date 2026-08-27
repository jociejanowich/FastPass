import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Caption1,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { MilestoneViewModel } from '../domain/selectors';
import { MILESTONE_ORDER } from '../data/mockData';
import { formatDate, formatDueRelative } from '../utils/date';
import { MilestoneStatus } from './MilestoneStatus';
import { StatusBadge } from './StatusBadge';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  name: { fontWeight: tokens.fontWeightSemibold },
  subtitle: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  description: {
    color: tokens.colorNeutralForeground2,
    padding: `0 0 ${tokens.spacingVerticalM}`,
  },
  taskList: { display: 'flex', flexDirection: 'column' },
  taskRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  taskMeta: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  taskName: { fontWeight: tokens.fontWeightSemibold },
  blocker: { color: tokens.colorPaletteRedForeground1 },
});

export interface MilestoneAccordionProps {
  milestones: MilestoneViewModel[];
}

export function MilestoneAccordion({ milestones }: MilestoneAccordionProps): JSX.Element {
  const styles = useStyles();
  const defaultOpen = milestones.find((m) => m.status !== 'Complete')?.id;

  return (
    <Accordion multiple collapsible defaultOpenItems={defaultOpen ? [defaultOpen] : []}>
      {milestones.map((milestone) => (
        <AccordionItem key={milestone.id} value={milestone.id}>
          <AccordionHeader expandIconPosition="end">
            <span className={styles.header}>
              <span className={styles.headerTop}>
                <Text className={styles.name}>{milestone.name}</Text>
                <MilestoneStatus status={milestone.status} />
              </span>
              <Caption1>
                {milestone.completedCount} of {milestone.taskCount} task
                {milestone.taskCount === 1 ? '' : 's'} complete
              </Caption1>
            </span>
          </AccordionHeader>
          <AccordionPanel>
            <Text size={300} block className={styles.description}>
              {milestone.description}
            </Text>
            <div className={styles.taskList}>
              {milestone.tasks.map((task) => (
                <div key={task.id} className={styles.taskRow}>
                  <div className={styles.taskMeta}>
                    <Text className={styles.taskName}>{task.name}</Text>
                    <Caption1>
                      {task.status === 'Completed'
                        ? `Completed ${formatDate(task.completedDate ?? task.dueDate)}`
                        : task.dueDate
                          ? `Due ${formatDate(task.dueDate)} · ${formatDueRelative(task.dueDate)}`
                          : 'No due date'}
                    </Caption1>
                    {task.status === 'Blocked' && task.blockerDescription ? (
                      <Caption1 className={styles.blocker}>
                        Blocked: {task.blockerDescription}
                      </Caption1>
                    ) : null}
                  </div>
                  <StatusBadge status={task.status} size="small" />
                </div>
              ))}
            </div>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Kept exported so the milestones page can rely on the canonical ordering. */
export { MILESTONE_ORDER };
