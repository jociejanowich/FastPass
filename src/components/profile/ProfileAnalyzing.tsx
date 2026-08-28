import { Card, Spinner, Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  wrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
  },
  banner: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
  },
  skeleton: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  line: {
    height: '12px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  lineShort: { width: '55%' },
});

const SKELETON_ROWS = [4, 3, 5, 3];

export function ProfileAnalyzing(): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.wrap} aria-live="polite">
      <Card className={styles.banner}>
        <Spinner size="small" />
        <Text weight="semibold">Analyzing your onboarding journey…</Text>
      </Card>
      {SKELETON_ROWS.map((rows, cardIndex) => (
        <Card key={cardIndex} className={styles.skeleton} aria-hidden="true">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className={`${styles.line} ${rowIndex === rows - 1 ? styles.lineShort : ''}`}
            />
          ))}
        </Card>
      ))}
    </div>
  );
}
