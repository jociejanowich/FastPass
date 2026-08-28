import {
  Avatar,
  Badge,
  Button,
  Caption1,
  Menu,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  OverlayDrawer,
  DrawerBody,
  Text,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  AlertRegular,
  ChevronDownRegular,
  DismissRegular,
  NavigationRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from '@fluentui/react-icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppActions, useAppState } from '../state/appHooks';
import { useEmployeeViewModel } from '../state/derivedHooks';
import { DEMO_VIEWERS } from '../data/viewers';
import { formatDateTime } from '../utils/date';
import { layout } from '../theme/tokens';
import { useTheme } from '../theme/themeContext';
import { ProductMark } from './ProductMark';
import { SideNavigation } from './SideNavigation';

const useStyles = makeStyles({
  shell: {
    display: 'grid',
    gridTemplateRows: `${layout.headerHeight} 1fr`,
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  topbar: {
    gridRow: '1',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `0 ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  topbarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  spacer: { flexGrow: 1 },
  refreshMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: '1.2',
    '@media (max-width: 640px)': { display: 'none' },
  },
  body: {
    gridRow: '2',
    display: 'grid',
    gridTemplateColumns: `${layout.navWidth} 1fr`,
    minHeight: 0,
    '@media (max-width: 1024px)': { gridTemplateColumns: '1fr' },
  },
  navColumn: {
    minHeight: 0,
    '@media (max-width: 1024px)': { display: 'none' },
  },
  main: {
    minWidth: 0,
    overflowY: 'auto',
    padding: tokens.spacingVerticalXXL,
    '@media (max-width: 640px)': { padding: tokens.spacingVerticalL },
  },
  content: {
    maxWidth: layout.contentMaxWidth,
    margin: '0 auto',
  },
  hamburger: {
    '@media (min-width: 1025px)': { display: 'none' },
  },
  drawerNav: { width: '280px', padding: 0 },
  blockerBadge: { cursor: 'default', flexShrink: 0, whiteSpace: 'nowrap' },
  blockerWord: {
    '@media (max-width: 640px)': { display: 'none' },
  },
  refreshLabel: {
    '@media (max-width: 640px)': { display: 'none' },
  },
  viewerName: {
    marginLeft: tokens.spacingHorizontalXS,
    '@media (max-width: 820px)': { display: 'none' },
  },
});

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const styles = useStyles();
  const location = useLocation();
  const { lastRefreshed, mutating, status, viewer } = useAppState();
  const { refresh, setViewer } = useAppActions();
  const employee = useEmployeeViewModel();
  const { mode, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const blockerCount = employee?.blockerCount ?? 0;
  const isEmployee = viewer.role === 'employee';
  const checkedViewer = useMemo(() => ({ viewer: [viewer.id] }), [viewer.id]);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Button
          className={styles.hamburger}
          appearance="subtle"
          icon={<NavigationRegular />}
          aria-label="Open navigation menu"
          onClick={() => setDrawerOpen(true)}
        />
        <div className={styles.topbarBrand}>
          <ProductMark />
          <Text weight="bold" size={400}>
            FastPass
          </Text>
        </div>

        <div className={styles.spacer} />

        {isEmployee ? (
          <Tooltip
            content={
              blockerCount > 0
                ? `${blockerCount} blocker needs attention. Your manager is alerted automatically.`
                : 'No blockers. Your manager sees a progress summary.'
            }
            relationship="description"
          >
            <Badge
              className={styles.blockerBadge}
              appearance="tint"
              color={blockerCount > 0 ? 'danger' : 'success'}
              icon={<AlertRegular />}
              aria-label={`${blockerCount} active blocker${blockerCount === 1 ? '' : 's'}`}
            >
              {blockerCount}
              <span className={styles.blockerWord}>
                &nbsp;blocker{blockerCount === 1 ? '' : 's'}
              </span>
            </Badge>
          </Tooltip>
        ) : null}

        <Menu
          checkedValues={checkedViewer}
          onCheckedValueChange={(_, data) => {
            const id = data.checkedItems[0];
            const next = DEMO_VIEWERS.find((v) => v.id === id);
            if (next && next.id !== viewer.id) setViewer(next);
          }}
        >
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              iconPosition="after"
              icon={<ChevronDownRegular />}
              aria-label={`Signed in as ${viewer.displayName}. Switch account.`}
            >
              <Avatar name={viewer.displayName} size={20} color="colorful" />
              <span className={styles.viewerName}>{viewer.displayName}</span>
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {DEMO_VIEWERS.map((v) => (
                <MenuItemRadio key={v.id} name="viewer" value={v.id}>
                  {v.displayName} — {v.role === 'manager' ? 'Manager' : 'Employee'}
                </MenuItemRadio>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        {isEmployee ? (
          <div className={styles.refreshMeta}>
            <Caption1>Last refreshed</Caption1>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              {status === 'ready' ? formatDateTime(lastRefreshed) : '—'}
            </Caption1>
          </div>
        ) : null}

        <Tooltip
          content={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          relationship="label"
        >
          <Button
            appearance="subtle"
            icon={mode === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
            onClick={toggle}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={mode === 'dark'}
          />
        </Tooltip>

        {isEmployee ? (
          <Button
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            onClick={() => void refresh()}
            disabled={mutating || status === 'loading'}
            aria-label="Refresh data"
          >
            <span className={styles.refreshLabel}>Refresh</span>
          </Button>
        ) : null}
      </header>

      <div className={styles.body}>
        <div className={styles.navColumn}>
          <SideNavigation viewer={viewer} employee={employee} />
        </div>
        <main className={styles.main} id="main-content" tabIndex={-1}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>

      <OverlayDrawer
        position="start"
        open={drawerOpen}
        onOpenChange={(_, data) => setDrawerOpen(data.open)}
      >
        <DrawerBody className={styles.drawerNav}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
          <SideNavigation
            viewer={viewer}
            employee={employee}
            onNavigate={() => setDrawerOpen(false)}
          />
        </DrawerBody>
      </OverlayDrawer>
    </div>
  );
}
