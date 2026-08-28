import { Button, Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import { LockClosedRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  card: {
    maxWidth: '460px',
    margin: '10vh auto 0',
    padding: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalM,
  },
  icon: { fontSize: '36px', color: tokens.colorNeutralForeground3 },
  body: { color: tokens.colorNeutralForeground2 },
});

export function ManagerAccessRequired(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  return (
    <Card className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <LockClosedRegular />
      </span>
      <Text as="h1" size={600} weight="bold">
        Manager access only
      </Text>
      <Text size={300} className={styles.body}>
        The Team dashboard shows onboarding progress and blockers for a manager&rsquo;s direct
        reports. You&rsquo;re signed in as an employee, so it isn&rsquo;t available to you.
      </Text>
      <Button appearance="primary" onClick={() => navigate('/dashboard')}>
        Back to my dashboard
      </Button>
    </Card>
  );
}
