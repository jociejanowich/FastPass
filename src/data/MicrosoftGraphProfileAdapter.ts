/**
 * Placeholder Microsoft Graph profile adapter.
 *
 * FastPass identifies "the current employee" and shows profile details
 * (display name, job title, department). In production those fields would come
 * from Microsoft Graph rather than being stored in Dataverse.
 *
 * Where this fits: DataverseFastPassRepository.getCurrentEmployee() would call
 * this adapter for identity + profile, then merge in the onboarding-specific
 * fields (journeyStatus, currentMilestone, startDate) from Dataverse.
 *
 * Implementation notes:
 *  - Scopes: User.Read (self) or User.Read.All (for a manager viewing a report).
 *  - GET https://graph.microsoft.com/v1.0/me?$select=id,displayName,jobTitle,department
 *  - GET https://graph.microsoft.com/v1.0/me/manager?$select=displayName
 *  - Map onto GraphProfile below; never expose the raw Graph payload upstream.
 */

export interface GraphProfile {
  id: string;
  displayName: string;
  jobTitle: string | null;
  department: string | null;
  managerName: string | null;
}

export interface GraphConfig {
  clientId: string;
  tenantId: string;
}

export interface MicrosoftGraphProfileAdapter {
  getMyProfile(): Promise<GraphProfile>;
}

const NOT_IMPLEMENTED =
  'MicrosoftGraphProfileAdapter is a placeholder. Implement with MSAL + Microsoft Graph to resolve the signed-in user.';

export class StubMicrosoftGraphProfileAdapter implements MicrosoftGraphProfileAdapter {
  constructor(private readonly config: GraphConfig) {}

  async getMyProfile(): Promise<GraphProfile> {
    throw new Error(`${NOT_IMPLEMENTED} (tenant ${this.config.tenantId || 'unset'})`);
  }
}
