/**
 * Employee development profile — deterministic analysis engine.
 *
 * Produces the "About Me" page content from onboarding data alone. Each field
 * of `ProfileAnalysis` is derived independently so it can later be replaced,
 * one field at a time, by a Power Automate flow (see
 * data/ProfileAnalysisService.ts and its field mapping).
 *
 * Content rules enforced here:
 *  - only supplied data is used; no invented employee facts
 *  - every strength / development area carries its own evidence string
 *  - career directions are phrased as possibilities, never certainties
 *  - risks are "potential", matched to prior friction, never predictions of failure
 */

import { calculateProgressPercentage } from './businessRules';
import { getDetectionRule } from './detection';
import { SIGNAL_SOURCE_LABEL, type SignalSource } from './signals';
import type { Employee, EmployeeTask, Milestone, Resource } from './types';
import { daysFromToday, formatDate } from '../utils/date';

/* -------------------------------------------------------------------------- */
/* Output types — mirror the Power Automate flow response fields               */
/* -------------------------------------------------------------------------- */

export interface EvidenceItem {
  label: string;
  evidence: string;
}

export interface SkillsSnapshot {
  demonstrated: string[];
  developing: string[];
  recommended: string[];
}

export interface LearningArea {
  topic: string;
  reason: string;
}

export interface CareerDirection {
  path: string;
  whyItFits: string;
  skillsToDevelop: string[];
}

export interface CareerTrajectory {
  current: string;
  nearTerm: string;
  nextStepRoles: string[];
  longerTerm: string[];
}

export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface RiskCard {
  taskName: string;
  dueDate: string | null;
  level: RiskLevel;
  rationale: string;
  sharedComponents: string[];
  nextSteps: string[];
  learningPlan: string[];
  support: string;
}

export interface RoleContext {
  role: string;
  team: string | null;
  summary: string;
  typicalActivities: string[];
}

export interface ProfileAnalysis {
  profileSummary: string;
  roleContext: RoleContext;
  strengths: EvidenceItem[];
  developmentAreas: EvidenceItem[];
  skillsSnapshot: SkillsSnapshot;
  learningAreas: LearningArea[];
  performanceSummary: string;
  careerDirections: CareerDirection[];
  careerTrajectory: CareerTrajectory;
  upcomingRisks: RiskCard[];
  generatedAt: string;
}

export interface ProfileAnalysisInput {
  employee: Employee;
  tasks: EmployeeTask[];
  milestones: Milestone[];
  resources: Resource[];
  now?: string;
}

/* -------------------------------------------------------------------------- */
/* Task friction model                                                         */
/* -------------------------------------------------------------------------- */

type WorkType =
  | 'device-setup'
  | 'access-approval'
  | 'training'
  | 'self-directed-reading'
  | 'scheduled-meeting'
  | 'team-connection'
  | 'general';

interface TaskLens {
  task: EmployeeTask;
  source: SignalSource | null;
  workType: WorkType;
  /** Strong friction: a blocker, a missed due date, or a stall. */
  strongFriction: string | null;
  /** Weak friction: a note that hints at difficulty or dependency. */
  weakFriction: string | null;
  gatesOpenMilestone: boolean;
}

const DEPENDENCY_NOTE =
  /wait|block|pending|depend|not sure|chase|someone else|approver|dense|come back|manual fix|revisit/i;
const EXTERNAL_BLOCKER =
  /awaiting|has not|not been|pending|approver|another team|asset management/i;

function workTypeOf(source: SignalSource | null): WorkType {
  switch (source) {
    case 'device-management':
      return 'device-setup';
    case 'access-management':
      return 'access-approval';
    case 'learning':
      return 'training';
    case 'knowledge-base':
      return 'self-directed-reading';
    case 'calendar':
      return 'scheduled-meeting';
    case 'collaboration':
      return 'team-connection';
    default:
      return 'general';
  }
}

function lensFor(
  task: EmployeeTask,
  allTasks: readonly EmployeeTask[],
  milestones: readonly Milestone[],
): TaskLens {
  const source = getDetectionRule(task.name)?.source ?? null;
  const workType = workTypeOf(source);

  let strongFriction: string | null = null;
  if (task.status === 'Blocked' || task.blockerFlag) {
    strongFriction = task.blockerDescription
      ? `blocked — ${lowerFirst(task.blockerDescription)}`
      : 'blocked and awaiting action';
  } else if (
    task.status === 'Completed' &&
    task.completedDate &&
    task.dueDate &&
    task.completedDate > task.dueDate
  ) {
    strongFriction = `finished after its due date (${formatDate(task.dueDate)})`;
  } else if (
    task.status === 'In Progress' &&
    task.dueDate &&
    (daysFromToday(task.dueDate) ?? 99) <= 1
  ) {
    strongFriction = 'still in progress with the due date already here';
  }

  let weakFriction: string | null = null;
  if (task.notes && DEPENDENCY_NOTE.test(task.notes)) {
    weakFriction = task.notes;
  } else if (
    task.blockerDescription &&
    EXTERNAL_BLOCKER.test(task.blockerDescription) &&
    !strongFriction
  ) {
    weakFriction = task.blockerDescription;
  }

  const owningMilestone = milestones.find((m) => m.taskNames.includes(task.name));
  const gatesOpenMilestone = Boolean(
    owningMilestone &&
    owningMilestone.taskNames.some((name) => {
      const sibling = allTasks.find((t) => t.name === name);
      return sibling !== undefined && sibling.status !== 'Completed';
    }),
  );

  return { task, source, workType, strongFriction, weakFriction, gatesOpenMilestone };
}

function lowerFirst(text: string): string {
  return text.length > 0 ? text[0]!.toLowerCase() + text.slice(1) : text;
}

function isComplete(task: EmployeeTask): boolean {
  return task.status === 'Completed';
}

function onTime(task: EmployeeTask): boolean {
  if (!task.completedDate || !task.dueDate) return true;
  return task.completedDate <= task.dueDate;
}

/* -------------------------------------------------------------------------- */
/* Section builders                                                            */
/* -------------------------------------------------------------------------- */

function buildRoleContext(employee: Employee, lenses: TaskLens[]): RoleContext {
  const engineering = /engineer|develop|software/i.test(employee.role);
  const activities = new Set<string>();
  if (engineering) {
    activities.add('Collaborative meetings, stand-ups, and code reviews');
    activities.add('Working in a local development environment and shared codebase');
  }
  for (const lens of lenses) {
    switch (lens.workType) {
      case 'training':
        activities.add('Required security and compliance training');
        break;
      case 'self-directed-reading':
        activities.add('Reading and applying team engineering standards and runbooks');
        break;
      case 'access-approval':
        activities.add('Requesting and managing access to tools and environments');
        break;
      case 'device-setup':
        activities.add('Provisioning and configuring hardware and developer tooling');
        break;
      case 'scheduled-meeting':
        activities.add('Regular check-ins with the manager');
        break;
      default:
        break;
    }
  }
  return {
    role: employee.role,
    team: employee.team || null,
    summary: `Typical day-to-day for a ${employee.role}${
      employee.team ? ` on the ${employee.team} team` : ''
    }: hands-on engineering work alongside meetings, structured learning, and keeping tools and access current.`,
    typicalActivities: [...activities].slice(0, 5),
  };
}

function buildProfileSummary(
  employee: Employee,
  progress: number,
  strengths: EvidenceItem[],
  developmentAreas: EvidenceItem[],
  completed: EmployeeTask[],
): string {
  const where = employee.team
    ? `${employee.role} on the ${employee.team} team${
        employee.department ? ` (${employee.department})` : ''
      }`
    : employee.role;
  const strengthPhrase = strengths.length
    ? strengths
        .slice(0, 2)
        .map((s) => lowerFirst(s.label))
        .join(', and ')
    : 'steady, structured progress';
  const patternPhrase = developmentAreas.length
    ? lowerFirst(developmentAreas[0]!.label)
    : 'no clear friction so far';
  const categories = [...new Set(completed.map((t) => t.category))];

  return [
    `${employee.displayName} is a ${where}, currently ${progress}% through onboarding (milestone: ${employee.currentMilestone}).`,
    `${completed.length} ${plural(completed.length, 'task')} completed so far, spanning ${listPhrase(
      categories,
    )}.`,
    `Demonstrated strengths: ${strengthPhrase}.`,
    `Development focus for the weeks ahead — ${patternPhrase}; a normal shape at this stage of onboarding.`,
  ].join(' ');
}

function buildStrengths(completed: EmployeeTask[], lenses: TaskLens[]): EvidenceItem[] {
  const out: EvidenceItem[] = [];
  const byType = (t: WorkType) =>
    lenses.filter((l) => l.workType === t && isComplete(l.task)).map((l) => l.task);

  const training = byType('training');
  if (training.length >= 1) {
    const early = training.find((t) => t.completedDate && t.dueDate && t.completedDate < t.dueDate);
    out.push({
      label: 'Completes required training reliably',
      evidence: `${listPhrase(training.map((t) => t.name))} done${
        early ? `, ${early.name} ahead of its due date` : ' on schedule'
      }.`,
    });
  }

  const setup = byType('device-setup');
  if (setup.length >= 1) {
    const note = setup.find((t) => t.notes)?.notes;
    out.push({
      label: 'Sets up their own working environment',
      evidence: `${listPhrase(setup.map((t) => t.name))} completed${
        note ? `; note: "${trimNote(note)}"` : ''
      }.`,
    });
  }

  const reading = byType('self-directed-reading');
  if (reading.length >= 1) {
    out.push({
      label: 'Engages with team documentation early',
      evidence: `${listPhrase(reading.map((t) => t.name))} reviewed in the first week.`,
    });
  }

  const connection = byType('team-connection');
  if (connection.length >= 1) {
    out.push({
      label: 'Gets connected with the team quickly',
      evidence: `${listPhrase(connection.map((t) => t.name))} completed on day one.`,
    });
  }

  const onTimeCount = completed.filter(onTime).length;
  if (completed.length >= 3 && onTimeCount / completed.length >= 0.75) {
    const categories = [...new Set(completed.map((t) => t.category))];
    out.push({
      label: 'Consistent, on-pace delivery of structured work',
      evidence: `${onTimeCount} of ${completed.length} completed tasks finished on or before their due date, across ${listPhrase(
        categories,
      )}.`,
    });
  }

  return out.slice(0, 5);
}

function buildDevelopmentAreas(lenses: TaskLens[], completed: EmployeeTask[]): EvidenceItem[] {
  const out: EvidenceItem[] = [];

  const blocked = lenses.find((l) => l.task.status === 'Blocked');
  if (blocked) {
    const escalationHint = blocked.task.notes && /not sure|chase|who/i.test(blocked.task.notes);
    out.push({
      label: escalationHint
        ? 'May benefit from earlier escalation when a task is blocked'
        : 'Has an unresolved blocker that needs following up',
      evidence: `"${blocked.task.name}" — ${trimNote(
        blocked.task.blockerDescription ?? 'blocked',
      )}${blocked.task.notes ? ` Note: "${trimNote(blocked.task.notes)}"` : ''}`,
    });
  }

  const stalled = lenses.find(
    (l) => l.task.status === 'In Progress' && l.strongFriction && l.workType === 'access-approval',
  );
  const accessDep = lenses.find(
    (l) => l.workType === 'access-approval' && (l.strongFriction || l.weakFriction),
  );
  if (stalled || accessDep) {
    const t = (stalled ?? accessDep)!.task;
    out.push({
      label: 'Has experienced delays on tasks that depend on external approvals',
      evidence: `"${t.name}"${t.notes ? ` — note: "${trimNote(t.notes)}"` : ' is waiting on an approver.'}`,
    });
  }

  const late = lenses.find(
    (l) => isComplete(l.task) && l.strongFriction && /after its due date/.test(l.strongFriction),
  );
  if (late) {
    out.push({
      label: 'Configuration-heavy setup has taken longer than planned',
      evidence: `"${late.task.name}" ${late.strongFriction}${
        late.task.notes ? `; note: "${trimNote(late.task.notes)}"` : ''
      }.`,
    });
  }

  const lingering = lenses.find(
    (l) => l.task.status === 'In Progress' && l.workType === 'self-directed-reading',
  );
  if (lingering) {
    out.push({
      label: 'Longer self-directed reading is still in progress',
      evidence: `"${lingering.task.name}"${
        lingering.task.notes
          ? ` — note: "${trimNote(lingering.task.notes)}"`
          : ' has been open for several days.'
      }`,
    });
  }

  const unscheduledMeetings = lenses.filter(
    (l) => l.workType === 'scheduled-meeting' && l.task.status === 'Not Started',
  );
  if (unscheduledMeetings.length >= 1) {
    out.push({
      label: 'Manager touchpoints are not scheduled yet',
      evidence: `${listPhrase(
        unscheduledMeetings.map((l) => l.task.name),
      )} not started — these are the fastest route to unblock open items.`,
    });
  }

  const hasHandsOn = completed.some((t) => /cod|build|implement|deploy|fix|develop/i.test(t.name));
  if (!hasHandsOn && out.length < 5) {
    out.push({
      label: 'Hands-on engineering work has not started yet',
      evidence:
        'Onboarding so far has been setup, training, and reading — a natural next area to build confidence, not a concern.',
    });
  }

  return out.slice(0, 5);
}

function buildSkillsSnapshot(lenses: TaskLens[], strengths: EvidenceItem[]): SkillsSnapshot {
  const demonstrated = new Set<string>();
  const developing = new Set<string>();

  for (const lens of lenses) {
    if (isComplete(lens.task)) {
      switch (lens.workType) {
        case 'training':
          demonstrated.add('Completing required training');
          break;
        case 'device-setup':
          demonstrated.add('Development environment and toolchain setup');
          break;
        case 'self-directed-reading':
          demonstrated.add('Working through team documentation');
          break;
        case 'team-connection':
          demonstrated.add('Getting connected with the team');
          break;
        default:
          break;
      }
    } else if (lens.task.status === 'In Progress') {
      switch (lens.workType) {
        case 'access-approval':
          developing.add('Navigating access and approval workflows');
          break;
        case 'self-directed-reading':
          developing.add('Applying the engineering standards');
          break;
        default:
          developing.add(`Completing "${lens.task.name}"`);
          break;
      }
    } else if (lens.workType === 'scheduled-meeting') {
      developing.add('Establishing a regular manager cadence');
    }
  }

  if (demonstrated.size === 0 && strengths.length) {
    demonstrated.add(strengths[0]!.label);
  }

  const recommended = [
    'Version control and opening a first pull request',
    'Reading and extending an existing codebase',
    "The team's CI/CD pipeline and staging environment",
    'Raising and escalating blockers early',
  ];

  return {
    demonstrated: [...demonstrated].slice(0, 4),
    developing: [...developing].slice(0, 4),
    recommended: recommended.slice(0, 4),
  };
}

function buildLearningAreas(lenses: TaskLens[]): LearningArea[] {
  const out: LearningArea[] = [];
  const accessFriction = lenses.some(
    (l) => l.workType === 'access-approval' && (l.strongFriction || l.weakFriction),
  );
  const readingInProgress = lenses.some(
    (l) => l.workType === 'self-directed-reading' && l.task.status === 'In Progress',
  );
  const blocked = lenses.some((l) => l.task.status === 'Blocked');

  if (accessFriction) {
    out.push({
      topic: "The team's access and approval workflow",
      reason:
        'Onboarding tasks have stalled at the approver step — knowing the request path and who signs off shortens the wait.',
    });
    out.push({
      topic: 'The CI/CD pipeline and staging environment',
      reason:
        'Access to both is still pending, and they are the path a first code change takes toward production.',
    });
  }
  out.push({
    topic: 'Git branching model and opening a first pull request',
    reason:
      'No hands-on coding task has started yet; the engineering standards handbook defines the model to practise against.',
  });
  if (readingInProgress) {
    out.push({
      topic: 'Time-boxing documentation review',
      reason:
        'The standards handbook has been open at partial completion for several days — a fixed review slot keeps knowledge tasks moving.',
    });
  }
  if (blocked) {
    out.push({
      topic: 'When and how to escalate a blocker',
      reason:
        'An open request has sat with another team since early in week one; earlier escalation is a learnable habit.',
    });
  }
  return out.slice(0, 5);
}

function buildPerformanceSummary(
  employee: Employee,
  progress: number,
  completed: EmployeeTask[],
  lenses: TaskLens[],
): string {
  const onTimeCount = completed.filter(onTime).length;
  const strongTypes = [
    ...new Set(lenses.filter((l) => isComplete(l.task)).map((l) => workTypeLabel(l.workType))),
  ].filter((label) => label !== 'this kind of work');
  const attentionTasks = lenses
    .filter((l) => l.strongFriction && l.task.status !== 'Completed')
    .map((l) => `"${l.task.name}"`);

  const first = `${employee.displayName} is ${progress}% through onboarding and on pace with required work — ${onTimeCount} of ${completed.length} completed tasks finished on or before their due date.`;
  const second = strongTypes.length
    ? `Progress is strongest in structured, self-service work: ${listPhrase(strongTypes)}.`
    : 'Progress is steady across the board.';
  const third = attentionTasks.length
    ? `Continued attention is warranted where progress depends on other teams — ${listPhrase(
        attentionTasks,
      )} ${plural(attentionTasks.length, 'is', 'are')} currently slowing the timeline.`
    : 'No tasks are currently causing delay.';
  return [first, second, third].join(' ');
}

function buildCareerDirections(employee: Employee, lenses: TaskLens[]): CareerDirection[] {
  const engineering = /engineer|develop|software/i.test(employee.role);
  const platform = /platform|infra|cloud|devops/i.test(employee.team);
  const strongProcess = lenses.filter((l) => isComplete(l.task) && onTime(l.task)).length >= 4;

  const directions: CareerDirection[] = [];

  if (engineering) {
    directions.push({
      path: 'Software Engineering',
      whyItFits:
        'Current role, and the early signals fit: independent environment setup, engagement with engineering standards, and steady completion of structured work.',
      skillsToDevelop: [
        'Version control and code review',
        'Reading and extending an existing codebase',
        'System design fundamentals',
      ],
    });
    directions.push({
      path: platform ? 'Platform / Solutions Engineering' : 'Solutions Engineering',
      whyItFits:
        'Comfort with configuration, tooling, and structured access workflows points toward roles that pair engineering with environment and integration work.',
      skillsToDevelop: ['Cloud platform fundamentals', 'Customer-facing technical communication'],
    });
  }

  if (strongProcess) {
    directions.push({
      path: 'Technical Program Management',
      whyItFits:
        'Consistent process adherence and reliable completion across every onboarding category are the core of coordination-focused roles.',
      skillsToDevelop: [
        'Cross-team coordination and stakeholder updates',
        'Risk and dependency tracking',
      ],
    });
  }

  if (directions.length === 0) {
    directions.push({
      path: employee.role,
      whyItFits: 'Not enough demonstrated work yet to point beyond the current role.',
      skillsToDevelop: ['Complete more hands-on onboarding tasks to establish a pattern'],
    });
  }

  return directions.slice(0, 3);
}

function buildCareerTrajectory(employee: Employee): CareerTrajectory {
  const engineering = /engineer/i.test(employee.role);
  const junior = /junior|associate|grad/i.test(employee.role);

  if (engineering) {
    const base = employee.role.replace(/junior\s+|associate\s+/i, '').trim();
    return {
      current: employee.role,
      nearTerm:
        'Ship first code changes through review, finish the engineering standards handbook, establish a regular manager check-in, and learn the access and deployment workflow.',
      nextStepRoles: junior
        ? [base || 'Software Engineer', 'Solutions Engineer']
        : ['Senior Software Engineer', 'Solutions Engineer'],
      longerTerm: [
        'Senior Software Engineer',
        'Platform / Cloud Engineer',
        'Technical Program Manager',
      ],
    };
  }

  return {
    current: employee.role,
    nearTerm:
      'Build depth in the core responsibilities of the current role and complete the remaining onboarding milestones.',
    nextStepRoles: [employee.role.replace(/junior\s+|associate\s+/i, '').trim() || employee.role],
    longerTerm: ['Senior individual contributor', 'Team lead'],
  };
}

/* -------------------------------------------------------------------------- */
/* Risk cards                                                                  */
/* -------------------------------------------------------------------------- */

interface ScoredRisk {
  lens: TaskLens;
  score: number;
  level: RiskLevel;
  matchedFriction: TaskLens[];
}

function scoreRisks(lenses: TaskLens[]): ScoredRisk[] {
  const strongSources = new Set(
    lenses
      .filter((l) => l.strongFriction)
      .map((l) => l.source)
      .filter(Boolean) as SignalSource[],
  );
  const strongTypes = new Set(lenses.filter((l) => l.strongFriction).map((l) => l.workType));
  const weakSources = new Set(
    lenses
      .filter((l) => l.weakFriction)
      .map((l) => l.source)
      .filter(Boolean) as SignalSource[],
  );
  const weakTypes = new Set(lenses.filter((l) => l.weakFriction).map((l) => l.workType));
  const externalDependency = lenses.some(
    (l) =>
      (l.strongFriction || l.weakFriction) &&
      (l.workType === 'access-approval' ||
        (l.task.blockerDescription != null && EXTERNAL_BLOCKER.test(l.task.blockerDescription))),
  );

  // Upcoming = incomplete, not currently blocked (active blockers are shown elsewhere).
  const upcoming = lenses.filter(
    (l) => l.task.status === 'In Progress' || l.task.status === 'Not Started',
  );

  const scored = upcoming.map<ScoredRisk>((lens) => {
    let score = 0;
    const matched: TaskLens[] = [];

    if (lens.strongFriction) {
      score += 3;
    }
    if (lens.source && strongSources.has(lens.source) && !lens.strongFriction) {
      score += 2;
      matched.push(...lenses.filter((l) => l.strongFriction && l.source === lens.source));
    }
    if (strongTypes.has(lens.workType) && !lens.strongFriction) {
      score += 2;
      matched.push(...lenses.filter((l) => l.strongFriction && l.workType === lens.workType));
    }
    if (lens.workType === 'access-approval' && externalDependency) {
      score += 2;
      matched.push(
        ...lenses.filter(
          (l) =>
            l.strongFriction &&
            l.task.blockerDescription != null &&
            EXTERNAL_BLOCKER.test(l.task.blockerDescription),
        ),
      );
    }
    if (lens.source && weakSources.has(lens.source)) score += 1;
    if (weakTypes.has(lens.workType)) score += 1;
    if (lens.gatesOpenMilestone && lens.task.required) score += 1;
    const due = daysFromToday(lens.task.dueDate);
    if (due !== null && due <= 3) score += 1;

    if (matched.length === 0 && (lens.strongFriction || lens.weakFriction)) {
      matched.push(lens);
    }

    let level: RiskLevel = 'Low';
    if (score >= 5 || (lens.strongFriction && (strongSources.size > 0 || externalDependency))) {
      level = 'High';
    } else if (score >= 3) {
      level = 'Medium';
    }

    return { lens, score, level, matchedFriction: dedupe(matched) };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function resourceFor(task: EmployeeTask, resources: readonly Resource[]): Resource | null {
  if (task.recommendedResourceId) {
    const byId = resources.find((r) => r.id === task.recommendedResourceId);
    if (byId) return byId;
  }
  return resources.find((r) => r.relatedTaskNames.includes(task.name)) ?? null;
}

function buildRiskCard(risk: ScoredRisk, resources: readonly Resource[]): RiskCard {
  const { lens, level } = risk;
  const task = lens.task;
  const resource = resourceFor(task, resources);
  const priorNames = risk.matchedFriction
    .filter((m) => m.task.name !== task.name)
    .map((m) => `"${m.task.name}"`);

  let rationale: string;
  if (level === 'High') {
    rationale =
      priorNames.length > 0
        ? `Closely mirrors ${listPhrase(priorNames)}, where progress has stalled waiting on someone else. ${
            task.notes ? `This task's own note: "${trimNote(task.notes)}".` : ''
          } Both are tasks where completion is not fully in the employee's hands.`.trim()
        : `${
            lens.strongFriction ? capitalize(lens.strongFriction) + '. ' : ''
          }A critical dependency here has already caused delay elsewhere in onboarding.`;
  } else if (level === 'Medium') {
    rationale = priorNames.length
      ? `Partial overlap with ${listPhrase(priorNames)} — same kind of work (${workTypeLabel(
          lens.workType,
        )}), and it is currently behind pace.`
      : `Some overlap with earlier areas of difficulty (${workTypeLabel(
          lens.workType,
        )}); worth preparing for.`;
    if (task.notes) rationale += ` Note: "${trimNote(task.notes)}".`;
  } else {
    rationale = `Little sign of prior difficulty with ${workTypeLabel(
      lens.workType,
    )}, but some preparation still helps — this task is on the critical path for later work.`;
  }

  const sharedComponents = sharedComponentsFor(lens, risk.matchedFriction);
  const nextSteps = nextStepsFor(lens, level);
  const learningPlan = learningPlanFor(lens, resource);
  const support = supportFor(lens, level, resource);

  return {
    taskName: task.name,
    dueDate: task.dueDate,
    level,
    rationale,
    sharedComponents,
    nextSteps,
    learningPlan,
    support,
  };
}

function sharedComponentsFor(lens: TaskLens, matched: TaskLens[]): string[] {
  const out = new Set<string>();
  if (lens.source) out.add(SIGNAL_SOURCE_LABEL[lens.source] + ' system');
  switch (lens.workType) {
    case 'access-approval':
      out.add('External approver / another team must act');
      out.add('Permissions and access workflow');
      out.add('No self-serve completion path');
      break;
    case 'device-setup':
      out.add('Hardware or software configuration');
      out.add('Fulfillment by another team');
      break;
    case 'self-directed-reading':
      out.add('Long self-directed reading of dense material');
      out.add('Easy to deprioritise against scheduled work');
      break;
    case 'scheduled-meeting':
      out.add('Depends only on finding a shared calendar slot');
      break;
    default:
      break;
  }
  for (const m of matched) {
    if (m.task.name !== lens.task.name) out.add(`Same pattern as "${m.task.name}"`);
  }
  const due = daysFromToday(lens.task.dueDate);
  if (due !== null && due <= 1) out.add('Due now, with work still outstanding');
  return [...out].slice(0, 4);
}

function nextStepsFor(lens: TaskLens, level: RiskLevel): string[] {
  switch (lens.workType) {
    case 'access-approval':
      return [
        'Confirm who the approver is and message them directly today',
        'Ask the manager or a teammate to expedite if it is not approved by the due date',
        'Record the request IDs so status is easy to chase',
      ];
    case 'self-directed-reading':
      return [
        'Block a focused 45-minute slot to finish the outstanding sections',
        'Write down 2–3 questions to raise at the next team meeting',
        'Mark the task done once the questions are logged, then revisit detail as needed',
      ];
    case 'scheduled-meeting':
      return [
        'Send the calendar invite this week',
        'Bring the current open blockers to the conversation',
        'Agree a recurring check-in cadence while scheduling',
      ];
    case 'device-setup':
      return [
        'Follow up on the open fulfillment request and ask for an ETA',
        'Request a loaner or temporary alternative so work can continue',
        'Escalate to the manager if it is not resolved before the due date',
      ];
    default:
      return [
        level === 'Low'
          ? 'Start the task early to leave room for surprises'
          : 'Break the task into smaller steps and start the first one now',
        'Identify any dependency or access it needs before the due date',
        'Flag it at the next check-in if progress stalls',
      ];
  }
}

function learningPlanFor(lens: TaskLens, resource: Resource | null): string[] {
  const res = resource
    ? `Use: ${resource.name}`
    : 'Use: the approved onboarding resources for this area';
  switch (lens.workType) {
    case 'access-approval':
      return [
        'Review: the request path and approver roles',
        'Practise: tracking this request to completion',
        res,
      ];
    case 'self-directed-reading':
      return [
        'Review: the branching model and definition of done',
        'Practise: applying one standard to a small example change',
        res,
      ];
    case 'scheduled-meeting':
      return [
        'Review: the 1:1 conversation guide',
        'Practise: a short status + blockers summary',
        res,
      ];
    case 'device-setup':
      return [
        'Review: the device and tooling setup checklist',
        'Practise: verifying each tool works after install',
        res,
      ];
    default:
      return [
        'Review: the task description and its resource',
        'Practise: the first concrete step',
        res,
      ];
  }
}

function supportFor(lens: TaskLens, level: RiskLevel, resource: Resource | null): string {
  const resPart = resource ? `Approved resource: ${resource.name}.` : '';
  switch (lens.workType) {
    case 'access-approval':
      return `${resPart} Escalate to the manager if not resolved by the due date; IT support can confirm the approver.`.trim();
    case 'self-directed-reading':
      return `${resPart} A short SME or buddy walkthrough of the dense sections would speed this up.`.trim();
    case 'scheduled-meeting':
      return `${resPart} No additional support needed — self-serve.`.trim();
    case 'device-setup':
      return `${resPart} IT support owns fulfillment; loop in the manager if the due date is at risk.`.trim();
    default:
      return `${resPart} ${
        level === 'High'
          ? 'Raise early with the manager or a subject-matter expert.'
          : 'Manager check-in is enough for now.'
      }`.trim();
  }
}

/* -------------------------------------------------------------------------- */
/* Small text helpers                                                          */
/* -------------------------------------------------------------------------- */

function plural(n: number, singular: string, plural = `${singular}s`): string {
  return n === 1 ? singular : plural;
}

function listPhrase(items: readonly string[]): string {
  const seen = [...new Set(items)];
  if (seen.length === 0) return 'several areas';
  if (seen.length === 1) return seen[0]!;
  if (seen.length === 2) return `${seen[0]} and ${seen[1]}`;
  return `${seen.slice(0, -1).join(', ')}, and ${seen[seen.length - 1]}`;
}

function trimNote(note: string, limit = 170): string {
  const clean = note.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '')}…`;
}

function capitalize(text: string): string {
  return text.length ? text[0]!.toUpperCase() + text.slice(1) : text;
}

function dedupe(lenses: TaskLens[]): TaskLens[] {
  const seen = new Set<string>();
  return lenses.filter((l) => {
    if (seen.has(l.task.id)) return false;
    seen.add(l.task.id);
    return true;
  });
}

function workTypeLabel(type: WorkType): string {
  switch (type) {
    case 'access-approval':
      return 'access and approvals';
    case 'device-setup':
      return 'hardware and software setup';
    case 'self-directed-reading':
      return 'self-directed reading';
    case 'scheduled-meeting':
      return 'scheduled meetings';
    case 'training':
      return 'required training';
    case 'team-connection':
      return 'team connection';
    default:
      return 'this kind of work';
  }
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export function analyzeProfile(input: ProfileAnalysisInput): ProfileAnalysis {
  const { employee, tasks, milestones, resources } = input;
  const now = input.now ?? new Date().toISOString();

  const lenses = tasks.map((task) => lensFor(task, tasks, milestones));
  const completed = tasks.filter(isComplete);
  const progress = calculateProgressPercentage(tasks);

  const strengths = buildStrengths(completed, lenses);
  const developmentAreas = buildDevelopmentAreas(lenses, completed);
  const skillsSnapshot = buildSkillsSnapshot(lenses, strengths);
  const learningAreas = buildLearningAreas(lenses);
  const performanceSummary = buildPerformanceSummary(employee, progress, completed, lenses);
  const careerDirections = buildCareerDirections(employee, lenses);
  const careerTrajectory = buildCareerTrajectory(employee);
  const roleContext = buildRoleContext(employee, lenses);
  const profileSummary = buildProfileSummary(
    employee,
    progress,
    strengths,
    developmentAreas,
    completed,
  );

  const upcomingRisks = scoreRisks(lenses)
    .slice(0, 3)
    .map((risk) => buildRiskCard(risk, resources));

  return {
    profileSummary,
    roleContext,
    strengths,
    developmentAreas,
    skillsSnapshot,
    learningAreas,
    performanceSummary,
    careerDirections,
    careerTrajectory,
    upcomingRisks,
    generatedAt: now,
  };
}
