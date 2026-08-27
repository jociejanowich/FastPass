import {
  Accordion,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { MoreHorizontalRegular, ArrowResetRegular } from '@fluentui/react-icons';
import { TASK_SECTION_ORDER } from '../domain/businessRules';
import { PageHeader } from '../components/PageHeader';
import { TaskSection } from '../components/TaskSection';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppActions, useAppState } from '../state/appHooks';
import { useGroupedTasks } from '../state/derivedHooks';

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  accordion: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
});

export function TasksPage(): JSX.Element {
  const styles = useStyles();
  const { status, error, tasks, mutating } = useAppState();
  const { load, resetDemo } = useAppActions();
  const grouped = useGroupedTasks();

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error') {
    return <ErrorState description={error ?? undefined} onRetry={() => void load()} />;
  }

  const openByDefault = TASK_SECTION_ORDER.filter(
    (sectionStatus) => grouped[sectionStatus].length > 0 && sectionStatus !== 'Completed',
  );

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="My onboarding tasks"
        subtitle="Grouped by status so the most urgent work is always on top."
        crumbs={[{ label: 'FastPass' }, { label: 'Tasks' }]}
        actions={
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<MoreHorizontalRegular />}
                aria-label="Demo options"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<ArrowResetRegular />}
                  disabled={mutating}
                  onClick={() => void resetDemo()}
                >
                  Reset demo data
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks assigned"
          description="When onboarding tasks are assigned to you, they'll appear here grouped by status."
        />
      ) : (
        <Accordion
          className={styles.accordion}
          multiple
          collapsible
          defaultOpenItems={openByDefault}
        >
          {TASK_SECTION_ORDER.map((sectionStatus) => (
            <TaskSection
              key={sectionStatus}
              status={sectionStatus}
              tasks={grouped[sectionStatus]}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
}
