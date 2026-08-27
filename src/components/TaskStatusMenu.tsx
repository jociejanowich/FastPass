import {
  Menu,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Button,
} from '@fluentui/react-components';
import { ChevronDownRegular } from '@fluentui/react-icons';
import { TASK_STATUSES, type TaskStatus } from '../domain/types';
import { useAppActions, useAppState } from '../state/appHooks';

export interface TaskStatusMenuProps {
  taskId: string;
  status: TaskStatus;
  size?: 'small' | 'medium';
}

export function TaskStatusMenu({
  taskId,
  status,
  size = 'small',
}: TaskStatusMenuProps): JSX.Element {
  const { setTaskStatus } = useAppActions();
  const { mutating } = useAppState();

  return (
    <Menu
      checkedValues={{ status: [status] }}
      onCheckedValueChange={(_, data) => {
        const next = data.checkedItems[0] as TaskStatus | undefined;
        if (next && next !== status) {
          void setTaskStatus(taskId, next);
        }
      }}
    >
      <MenuTrigger disableButtonEnhancement>
        <Button
          size={size}
          appearance="outline"
          iconPosition="after"
          icon={<ChevronDownRegular />}
          disabled={mutating}
          aria-label={`Change status. Current status: ${status}`}
        >
          {status}
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {TASK_STATUSES.map((option) => (
            <MenuItemRadio key={option} name="status" value={option}>
              {option}
            </MenuItemRadio>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
