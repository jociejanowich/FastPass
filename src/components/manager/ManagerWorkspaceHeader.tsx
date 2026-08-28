import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowClockwiseRegular, PeopleTeamRegular } from '@fluentui/react-icons';
import { formatDateTime } from '../../utils/date';

const useStyles = makeStyles({
  header: {
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `4px solid ${tokens.colorBrandStroke1}`,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  left: { display: 'flex', gap: tokens.spacingHorizontalL, alignItems: 'center', minWidth: 0 },
  mark: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '20px',
  },
  text: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  eyebrow: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: tokens.colorBrandForeground2,
  },
  title: { fontWeight: tokens.fontWeightBold, lineHeight: '1.15' },
  meta: { color: tokens.colorNeutralForeground2 },
});

export interface ManagerWorkspaceHeaderProps {
  managerName: string;
  reportCount: number;
  generatedAt: string;
  onRefresh: () => void;
}

export function ManagerWorkspaceHeader({
  managerName,
  reportCount,
  generatedAt,
  onRefresh,
}: ManagerWorkspaceHeaderProps): JSX.Element {
  const styles = useStyles();
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.mark} aria-hidden="true">
          <PeopleTeamRegular />
        </span>
        <div className={styles.text}>
          <span className={styles.eyebrow}>Manager workspace</span>
          <Text as="h1" size={700} className={styles.title}>
            Team onboarding
          </Text>
          <Text size={200} className={styles.meta}>
            {reportCount} direct {reportCount === 1 ? 'report' : 'reports'} · {managerName} ·
            checked {formatDateTime(generatedAt)}
          </Text>
        </div>
      </div>
      <Button appearance="secondary" icon={<ArrowClockwiseRegular />} onClick={onRefresh}>
        Refresh
      </Button>
    </header>
  );
}
