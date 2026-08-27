import { Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  titleGroup: { display: 'flex', flexDirection: 'column', gap: '2px' },
  subtitle: { color: tokens.colorNeutralForeground3 },
});

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  id,
}: SectionCardProps): JSX.Element {
  const styles = useStyles();
  return (
    <Card className={styles.card} id={id}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Text as="h2" size={500} weight="semibold">
            {title}
          </Text>
          {subtitle ? (
            <Text size={200} className={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
