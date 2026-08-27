/**
 * FastPass palette and layout constants.
 *
 * Fluent's `webLightTheme` / `webDarkTheme` already use the Microsoft product
 * blue as their brand ramp, so Fluent components are themed correctly out of the
 * box in both modes. These constants cover the few FastPass-specific accents that
 * are not part of the Fluent token set (KPI card left borders, career-timeline
 * markers, nav active indicator). Prefer Fluent `tokens.*` for anything that
 * needs to adapt to light/dark; use `palette` only for fixed status accents.
 */

export const palette = {
  brandPrimary: '#0078D4',
  brandDark: '#0F3B70',
  success: '#107C10',
  warning: '#F2C811',
  warningText: '#8A6D00',
  blocked: '#C4314B',
  pageBackground: '#F5F5F5',
  cardBackground: '#FFFFFF',
  textPrimary: '#242424',
  textSecondary: '#616161',
  cardBorder: '#E1E1E1',
  neutralFuture: '#C7C7C7',
} as const;

export const layout = {
  navWidth: '260px',
  navWidthCompact: '72px',
  contentMaxWidth: '1160px',
  headerHeight: '56px',
} as const;

export const breakpoints = {
  tablet: '@media (max-width: 1024px)',
  mobile: '@media (max-width: 640px)',
} as const;
