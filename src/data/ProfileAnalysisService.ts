/**
 * Profile-analysis service contract.
 *
 * The "About Me" page depends on this interface, not on a concrete engine.
 * Today it is served by a local deterministic analysis; a Power Automate flow
 * can take over field by field without any page changes.
 */

import { analyzeProfile, type ProfileAnalysis } from '../domain/profileAnalysis';
import type { Employee, EmployeeTask, Milestone, Resource } from '../domain/types';

export interface ProfileAnalysisRequest {
  employee: Employee;
  tasks: EmployeeTask[];
  milestones: Milestone[];
  resources: Resource[];
}

export interface ProfileAnalysisService {
  analyze(request: ProfileAnalysisRequest): Promise<ProfileAnalysis>;
}

const ANALYSIS_LATENCY_MS = 900;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Deterministic local analysis. Simulates flow latency for the loading state. */
export class LocalProfileAnalysisService implements ProfileAnalysisService {
  constructor(private readonly latencyMs: number = ANALYSIS_LATENCY_MS) {}

  async analyze(request: ProfileAnalysisRequest): Promise<ProfileAnalysis> {
    await delay(this.latencyMs);
    return analyzeProfile({ ...request, now: new Date().toISOString() });
  }
}

/**
 * Placeholder Power Automate adapter.
 *
 * The flow is expected to return a JSON object with these top-level fields, one
 * per card on the page:
 *
 *   ProfileSummary      string
 *   RoleContext         { role, team, summary, typicalActivities[] }
 *   Strengths           { label, evidence }[]
 *   FocusAreas          { label, evidence }[]
 *   SkillsSnapshot      { demonstrated[], developing[], recommended[] }
 *   LearningAreas       { topic, reason }[]
 *   PerformanceSummary  string
 *   CareerDirection     { path, whyItFits, skillsToDevelop[] }[]
 *   CareerTrajectory    { current, nearTerm, nextStepRoles[], longerTerm[] }
 *   UpcomingRisks       RiskCard[]
 *
 * Each maps 1:1 onto ProfileAnalysis. Implement `mapFlowResponse` and the POST,
 * then select this service via VITE_PROFILE_ANALYSIS=power-automate.
 */
export interface PowerAutomateConfig {
  flowUrl: string;
}

const NOT_IMPLEMENTED =
  'PowerAutomateProfileAnalysisService is a placeholder. Set VITE_PROFILE_ANALYSIS=power-automate and VITE_PROFILE_FLOW_URL, then implement the POST + response mapping.';

export class PowerAutomateProfileAnalysisService implements ProfileAnalysisService {
  constructor(private readonly config: PowerAutomateConfig) {}

  async analyze(_request: ProfileAnalysisRequest): Promise<ProfileAnalysis> {
    throw new Error(`${NOT_IMPLEMENTED} (flow: ${this.config.flowUrl || 'unset'})`);
  }
}

export function createProfileAnalysisService(): ProfileAnalysisService {
  const engine = import.meta.env.VITE_PROFILE_ANALYSIS ?? 'mock';
  if (engine === 'power-automate') {
    const flowUrl = import.meta.env.VITE_PROFILE_FLOW_URL ?? '';
    if (!flowUrl) {
      console.warn(
        '[FastPass] VITE_PROFILE_ANALYSIS=power-automate but VITE_PROFILE_FLOW_URL is not set. Falling back to local analysis.',
      );
      return new LocalProfileAnalysisService();
    }
    return new PowerAutomateProfileAnalysisService({ flowUrl });
  }
  return new LocalProfileAnalysisService();
}
