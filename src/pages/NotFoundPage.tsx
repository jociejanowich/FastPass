import { Button, Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import { CompassNorthwestRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
    maxWidth: '460px',
    margin: '10vh auto 0',
  },
  icon: { fontSize: '40px', color: tokens.colorNeutralForeground3 },
});

export function NotFoundPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  return (
    <Card className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <CompassNorthwestRegular />
      </span>
      <Text as="h1" size={700} weight="bold">
        Page not found
      </Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
        That route doesn&rsquo;t exist in FastPass. Let&rsquo;s get you back to your dashboard.
      </Text>
      <Button appearance="primary" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </Card>
  );
}
