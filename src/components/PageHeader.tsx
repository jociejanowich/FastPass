import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXL,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  headings: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  subtitle: { color: tokens.colorNeutralForeground2, maxWidth: '68ch' },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' },
  badge: { marginTop: tokens.spacingVerticalXS },
});

export interface Crumb {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  crumbs = [{ label: 'FastPass' }],
  actions,
  badge,
}: PageHeaderProps): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <Breadcrumb aria-label="Breadcrumb" size="small">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} style={{ display: 'contents' }}>
              <BreadcrumbItem>
                <BreadcrumbButton
                  current={isLast}
                  onClick={crumb.path && !isLast ? () => navigate(crumb.path as string) : undefined}
                >
                  {crumb.label}
                </BreadcrumbButton>
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbDivider /> : null}
            </span>
          );
        })}
      </Breadcrumb>

      <div className={styles.titleRow}>
        <div className={styles.headings}>
          <Text as="h1" size={800} weight="bold">
            {title}
          </Text>
          {subtitle ? (
            <Text size={300} className={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          {badge ? <div className={styles.badge}>{badge}</div> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  );
}
