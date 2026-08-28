import { makeStyles, tokens } from '@fluentui/react-components';
import type { SkillsSnapshot } from '../../domain/profileAnalysis';
import { SectionCard } from '../SectionCard';
import { Bullets, LabeledBlock } from './primitives';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 620px)': { gridTemplateColumns: '1fr' },
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  colDemonstrated: {
    borderTop: `2px solid ${tokens.colorPaletteGreenBorder2}`,
    paddingTop: tokens.spacingVerticalS,
  },
  colDeveloping: {
    borderTop: `2px solid ${tokens.colorPaletteYellowBorderActive}`,
    paddingTop: tokens.spacingVerticalS,
  },
  colRecommended: {
    borderTop: `2px solid ${tokens.colorBrandStroke1}`,
    paddingTop: tokens.spacingVerticalS,
  },
});

export function SkillsSnapshotCard({ snapshot }: { snapshot: SkillsSnapshot }): JSX.Element {
  const styles = useStyles();
  return (
    <SectionCard title="🧠 Skills Snapshot" subtitle="Where skills stand and what comes next">
      <div className={styles.grid}>
        <div className={`${styles.col} ${styles.colDemonstrated}`}>
          <LabeledBlock label="Demonstrated strengths">
            <Bullets items={snapshot.demonstrated} />
          </LabeledBlock>
        </div>
        <div className={`${styles.col} ${styles.colDeveloping}`}>
          <LabeledBlock label="Developing skills">
            <Bullets items={snapshot.developing} />
          </LabeledBlock>
        </div>
        <div className={`${styles.col} ${styles.colRecommended}`}>
          <LabeledBlock label="Recommended next skills">
            <Bullets items={snapshot.recommended} />
          </LabeledBlock>
        </div>
      </div>
    </SectionCard>
  );
}
