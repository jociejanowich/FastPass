import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  ClockFilled,
  CircleRegular,
  DismissCircleFilled,
} from '@fluentui/react-icons';
import type { EmployeeTask, TaskStatus } from '../domain/types';
import { EmptyState } from './StateViews';
import { TaskRow } from './TaskRow';

const useStyles = makeStyles({
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    width: '100%',
  },
  title: { fontWeight: tokens.fontWeightSemibold },
  icon: { display: 'inline-flex', fontSize: '18px' },
  panel: { paddingBottom: tokens.spacingVerticalM },
});

const ICONS: Record<TaskStatus, JSX.Element> = {
  Blocked: <DismissCircleFilled style={{ color: tokens.colorPaletteRedForeground1 }} />,
  'In Progress': <ClockFilled style={{ color: tokens.colorPaletteYellowForeground2 }} />,
  'Not Started': <CircleRegular style={{ color: tokens.colorNeutralForeground3 }} />,
  Completed: <CheckmarkCircleFilled style={{ color: tokens.colorPaletteGreenForeground1 }} />,
};

const EMPTY_COPY: Record<TaskStatus, { title: string; description: string }> = {
  Blocked: {
    title: 'No blocked tasks',
    description: 'Nothing is blocked right now — good news for your timeline.',
  },
  'In Progress': {
    title: 'Nothing in progress',
    description: 'Start a task from Not Started to see it here.',
  },
  'Not Started': {
    title: 'Nothing left to start',
    description: 'Every task has been picked up or completed.',
  },
  Completed: {
    title: 'No completed tasks yet',
    description: 'Completed tasks will collect here as you finish them.',
  },
};

export interface TaskSectionProps {
  status: TaskStatus;
  tasks: EmployeeTask[];
}

export function TaskSection({ status, tasks }: TaskSectionProps): JSX.Element {
  const styles = useStyles();
  return (
    <AccordionItem value={status}>
      <AccordionHeader expandIconPosition="end">
        <span className={styles.headerContent}>
          <span className={styles.icon} aria-hidden="true">
            {ICONS[status]}
          </span>
          <Text className={styles.title}>{status}</Text>
          <Badge appearance="tint" color="informative" aria-label={`${tasks.length} tasks`}>
            {tasks.length}
          </Badge>
        </span>
      </AccordionHeader>
      <AccordionPanel className={styles.panel}>
        {tasks.length === 0 ? (
          <EmptyState
            title={EMPTY_COPY[status].title}
            description={EMPTY_COPY[status].description}
          />
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </AccordionPanel>
    </AccordionItem>
  );
}
