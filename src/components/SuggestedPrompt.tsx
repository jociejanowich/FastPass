import { Button } from '@fluentui/react-components';
import { ChatSparkleRegular } from '@fluentui/react-icons';

export interface SuggestedPromptProps {
  prompt: string;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompt({ prompt, onSelect, disabled }: SuggestedPromptProps): JSX.Element {
  return (
    <Button
      appearance="outline"
      size="small"
      icon={<ChatSparkleRegular />}
      disabled={disabled}
      onClick={() => onSelect(prompt)}
    >
      {prompt}
    </Button>
  );
}
