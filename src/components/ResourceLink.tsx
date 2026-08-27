import { Link, Tooltip } from '@fluentui/react-components';
import { OpenRegular } from '@fluentui/react-icons';
import type { Resource } from '../domain/types';

export interface ResourceLinkProps {
  resource: Resource | null;
  prefix?: string;
}

/** Renders a resource citation as an external link, or nothing when absent. */
export function ResourceLink({
  resource,
  prefix = 'Resource',
}: ResourceLinkProps): JSX.Element | null {
  if (!resource) return null;
  return (
    <Tooltip content={resource.description} relationship="description">
      <Link
        href={resource.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${prefix}: ${resource.name} (opens in a new tab)`}
      >
        {prefix}: {resource.name} <OpenRegular fontSize={12} aria-hidden="true" />
      </Link>
    </Tooltip>
  );
}
