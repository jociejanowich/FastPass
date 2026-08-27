import {
  Button,
  Caption1,
  Link,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { BotRegular, PersonRegular, SendRegular } from '@fluentui/react-icons';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { SUGGESTED_PROMPTS } from '../domain/assistantEngine';
import { useAppActions, useAppState } from '../state/appHooks';
import { formatDateTime } from '../utils/date';
import { SuggestedPrompt } from './SuggestedPrompt';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    height: '100%',
    minHeight: 0,
  },
  transcript: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    minHeight: '280px',
  },
  empty: {
    margin: 'auto',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    maxWidth: '46ch',
  },
  message: { display: 'flex', gap: tokens.spacingHorizontalS, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantMessage: { alignSelf: 'flex-start' },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground4,
  },
  bubble: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusLarge,
    whiteSpace: 'pre-wrap',
    lineHeight: tokens.lineHeightBase300,
  },
  userBubble: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  assistantBubble: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
  },
  citations: {
    marginTop: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  timestamp: { color: tokens.colorNeutralForeground3, marginTop: '2px' },
  prompts: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS },
  composer: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'flex-end' },
  textarea: { flexGrow: 1 },
  typing: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    alignSelf: 'flex-start',
    color: tokens.colorNeutralForeground3,
  },
});

export function AssistantChat(): JSX.Element {
  const styles = useStyles();
  const { assistant, status } = useAppState();
  const { sendAssistantMessage } = useAppActions();
  const [draft, setDraft] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [assistant.messages, assistant.processing]);

  const disabled = assistant.processing || status !== 'ready';

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || disabled) return;
    setDraft('');
    void sendAssistantMessage(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit(draft);
    }
  };

  return (
    <div className={styles.root}>
      <div
        className={styles.transcript}
        ref={transcriptRef}
        role="log"
        aria-live="polite"
        aria-label="Assistant conversation"
        tabIndex={0}
      >
        {assistant.messages.length === 0 && !assistant.processing ? (
          <div className={styles.empty}>
            <Text>
              Ask about your onboarding. Answers are generated from your live task, milestone, and
              blocker state — no external service.
            </Text>
          </div>
        ) : null}

        {assistant.messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={mergeClasses(
                styles.message,
                isUser ? styles.userMessage : styles.assistantMessage,
              )}
            >
              <span className={styles.avatar} aria-hidden="true">
                {isUser ? <PersonRegular /> : <BotRegular />}
              </span>
              <div>
                <div
                  className={mergeClasses(
                    styles.bubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  )}
                >
                  <Text>{message.text}</Text>
                  {message.citations && message.citations.length > 0 ? (
                    <div className={styles.citations}>
                      {message.citations.map((citation) => (
                        <Link
                          key={citation.url}
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {citation.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Caption1 className={styles.timestamp}>
                  {isUser ? 'You' : 'FastPass Assistant'} · {formatDateTime(message.timestamp)}
                </Caption1>
              </div>
            </div>
          );
        })}

        {assistant.processing ? (
          <div className={styles.typing} aria-hidden="true">
            <Spinner size="tiny" /> <Text size={200}>FastPass Assistant is thinking…</Text>
          </div>
        ) : null}
      </div>

      <div className={styles.prompts}>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <SuggestedPrompt key={prompt} prompt={prompt} onSelect={submit} disabled={disabled} />
        ))}
      </div>

      <div className={styles.composer}>
        <Textarea
          className={styles.textarea}
          resize="vertical"
          value={draft}
          placeholder="Ask about your onboarding…"
          aria-label="Message the FastPass Assistant"
          onChange={(_, data) => setDraft(data.value)}
          onKeyDown={onKeyDown}
          disabled={status !== 'ready'}
        />
        <Button
          appearance="primary"
          icon={<SendRegular />}
          disabled={disabled || draft.trim().length === 0}
          onClick={() => submit(draft)}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
