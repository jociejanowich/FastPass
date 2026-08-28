import { Badge, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import { NavLink } from 'react-router-dom';
import { navItemsForRole } from '../navigation';
import { palette } from '../theme/tokens';
import { ProductMark } from './ProductMark';
import type { EmployeeViewModel } from '../domain/selectors';
import type { Viewer } from '../domain/types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
  },
  brandText: { display: 'flex', flexDirection: 'column', lineHeight: '1.2' },
  tagline: {
    color: tokens.colorNeutralForeground3,
    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalM}`,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flexGrow: 1,
    overflowY: 'auto',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '-2px',
    },
  },
  linkActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    boxShadow: `inset 3px 0 0 ${palette.brandPrimary}`,
  },
  icon: { display: 'inline-flex', fontSize: '20px', flexShrink: 0 },
  footer: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  footerName: { fontWeight: tokens.fontWeightSemibold },
  footerMeta: { color: tokens.colorNeutralForeground3 },
});

export interface SideNavigationProps {
  viewer: Viewer;
  employee: EmployeeViewModel | null;
  onNavigate?: () => void;
}

export function SideNavigation({ viewer, employee, onNavigate }: SideNavigationProps): JSX.Element {
  const styles = useStyles();
  const items = navItemsForRole(viewer.role);

  return (
    <nav className={styles.root} aria-label="Primary">
      <div className={styles.brand}>
        <ProductMark />
        <span className={styles.brandText}>
          <Text weight="bold" size={400}>
            FastPass
          </Text>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Onboarding orchestration
          </Caption1>
        </span>
      </div>
      <Caption1 className={styles.tagline}>
        Turns fragmented onboarding information into prioritized action.
      </Caption1>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key}>
            <NavLink
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
            >
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <Text size={300} className={styles.footerName}>
          {viewer.displayName}
        </Text>
        <Caption1 className={styles.footerMeta}>{viewer.jobTitle}</Caption1>
        {viewer.role === 'manager' ? (
          <Badge appearance="tint" color="brand" size="small" style={{ alignSelf: 'flex-start' }}>
            Manager view
          </Badge>
        ) : employee ? (
          <Caption1 className={styles.footerMeta}>
            {employee.progressPercentage}% complete · {employee.journeyStatus}
          </Caption1>
        ) : null}
      </div>
    </nav>
  );
}
