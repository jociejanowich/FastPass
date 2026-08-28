/**
 * Manager (Team) dashboard view models.
 *
 * `buildManagerDashboard` turns every direct report's onboarding data into one
 * screen: a team overview, a prioritized attention queue (everything that used
 * to be a blocker-alert email), and a per-report roster with drill-in detail
 * (the daily-summary email, on screen). Pure — reuses the employee-side
 * selectors and the profile risk analysis so the two views never disagree.
 */

import { analyzeProfile, type RiskCard } from './profileAnalysis';
import {
  selectBlockers,
  selectEmployeeViewModel,
  selectManagerSummary,
  type BlockerViewModel,
  type EmployeeViewModel,
} from './selectors';
import type {
  EmployeeTask,
  ManagerSummary,
  Milestone,
  Resource,
  TeamMemberOnboarding,
  TeamOnboarding,
} from './types';
import { daysFromToday } from '../utils/date';

export type ReportStatus = 'blocked' | 'at-risk' | 'on-track' | 'just-started';

export interface ReportOnboarding {
  employee: TeamMemberOnboarding['employee'];
  vm: EmployeeViewModel;
  blockers: BlockerViewModel[];
  summary: ManagerSummary;
  highRisks: RiskCard[];
  overdueTasks: EmployeeTask[];
  priorityTasks: EmployeeTask[];
  daysIn: number;
  status: ReportStatus;
  headline: string;
}

export type AttentionKind = 'blocker' | 'overdue' | 'risk';
export type AttentionSeverity = 'high' | 'medium';

export interface AttentionItem {
  kind: AttentionKind;
  severity: AttentionSeverity;
  employeeId: string;
  employeeName: string;
  taskName: string;
  dueDate: string | null;
  detail: string;
  recommendedAction: string;
  daysOpen: number | null;
}

export interface TeamTotals {
  reports: number;
  onTrack: number;
  needAttention: number;
  blocked: number;
  overdueTasks: number;
  averageProgress: number;
  notYetReady: number;
}

export interface ManagerDashboard {
  managerName: string;
  reports: ReportOnboarding[];
  totals: TeamTotals;
  attention: AttentionItem[];
  generatedAt: string;
}

function isIncomplete(task: EmployeeTask): boolean {
  return task.status !== 'Completed';
}

function overdueIncompleteTasks(tasks: readonly EmployeeTask[]): EmployeeTask[] {
  return tasks
    .filter((task) => isIncomplete(task) && task.status !== 'Blocked')
    .filter((task) => {
      const delta = daysFromToday(task.dueDate);
      return delta !== null && delta < 0;
    })
    .slice()
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
}

function daysOpen(dueDate: string | null): number | null {
  const delta = daysFromToday(dueDate);
  return delta !== null && delta < 0 ? Math.abs(delta) : null;
}

function classify(
  blockers: BlockerViewModel[],
  highRisks: RiskCard[],
  overdue: EmployeeTask[],
  justStarted: boolean,
): ReportStatus {
  if (blockers.length > 0) return 'blocked';
  if (justStarted) return 'just-started';
  if (highRisks.length > 0 || overdue.length > 0) return 'at-risk';
  return 'on-track';
}

function headlineFor(report: Omit<ReportOnboarding, 'headline'>): string {
  const { vm, blockers, overdueTasks, highRisks, daysIn } = report;
  const pct = `${vm.progressPercentage}% complete`;
  switch (report.status) {
    case 'blocked':
      return `${pct} · blocked on ${blockers.map((b) => b.task.name).join(', ')}`;
    case 'at-risk':
      if (overdueTasks.length > 0) {
        return `${pct} · ${overdueTasks.length} task${
          overdueTasks.length === 1 ? '' : 's'
        } overdue`;
      }
      return `${pct} · upcoming risk on "${highRisks[0]?.taskName ?? 'an upcoming task'}"`;
    case 'just-started':
      return `Started ${daysIn === 0 ? 'today' : `${daysIn} day${daysIn === 1 ? '' : 's'} ago`} · getting set up`;
    default:
      return vm.readiness.ready
        ? `${pct} · ready for production work`
        : `${pct} · on track, ${vm.readiness.tasksRemaining} task${
            vm.readiness.tasksRemaining === 1 ? '' : 's'
          } left`;
  }
}

function buildReport(
  member: TeamMemberOnboarding,
  milestones: readonly Milestone[],
  resources: readonly Resource[],
  now: string,
): ReportOnboarding {
  const { employee, tasks } = member;
  const vm = selectEmployeeViewModel(employee, tasks, milestones);
  const blockers = selectBlockers(tasks, milestones, resources);
  const summary = selectManagerSummary(employee, tasks, milestones, resources, now);
  const daysIn = Math.max(0, -(daysFromToday(employee.startDate) ?? 0));

  // A brand-new hire has not had time to fall behind: skip risk projection and
  // overdue flags until they are a couple of days in.
  const justStarted = vm.progressPercentage === 0 && daysIn <= 1;
  const analysis = justStarted
    ? null
    : analyzeProfile({ employee, tasks, milestones, resources, now });
  const highRisks =
    analysis?.upcomingRisks.filter((risk) => risk.level === 'High').slice(0, 1) ?? [];
  const overdueTasks = justStarted ? [] : overdueIncompleteTasks(tasks);

  const priorityTasks = summary.priorityTasks
    .map((line) => tasks.find((task) => task.name === line.taskName))
    .filter((task): task is EmployeeTask => task !== undefined);

  const partial: Omit<ReportOnboarding, 'headline'> = {
    employee,
    vm,
    blockers,
    summary,
    highRisks,
    overdueTasks,
    priorityTasks,
    daysIn,
    status: classify(blockers, highRisks, overdueTasks, justStarted),
  };
  return { ...partial, headline: headlineFor(partial) };
}

function attentionItemsFor(report: ReportOnboarding): AttentionItem[] {
  const name = report.employee.displayName;
  const id = report.employee.employeeId;
  const items: AttentionItem[] = [];

  for (const blocker of report.blockers) {
    const due = daysFromToday(blocker.task.dueDate);
    items.push({
      kind: 'blocker',
      severity: due !== null && due <= 2 ? 'high' : 'medium',
      employeeId: id,
      employeeName: name,
      taskName: blocker.task.name,
      dueDate: blocker.task.dueDate,
      detail: blocker.blockerDescription,
      recommendedAction: blocker.recommendedAction,
      daysOpen: daysOpen(blocker.task.dueDate),
    });
  }

  for (const risk of report.highRisks) {
    items.push({
      kind: 'risk',
      severity: 'medium',
      employeeId: id,
      employeeName: name,
      taskName: risk.taskName,
      dueDate: risk.dueDate,
      detail: risk.rationale,
      recommendedAction: risk.nextSteps[0] ?? 'Check in before the due date.',
      daysOpen: null,
    });
  }

  for (const task of report.overdueTasks) {
    items.push({
      kind: 'overdue',
      severity: 'high',
      employeeId: id,
      employeeName: name,
      taskName: task.name,
      dueDate: task.dueDate,
      detail: `Overdue and not started or still in progress. ${task.description}`,
      recommendedAction:
        'Ask what is holding it up at your next check-in, or unblock a dependency.',
      daysOpen: daysOpen(task.dueDate),
    });
  }

  return items;
}

const KIND_RANK: Record<AttentionKind, number> = { blocker: 0, overdue: 1, risk: 2 };

/** One item per (report, task) — a blocker beats an overdue flag beats a risk. */
function dedupeAttention(items: AttentionItem[]): AttentionItem[] {
  const best = new Map<string, AttentionItem>();
  for (const item of items) {
    const key = `${item.employeeId}::${item.taskName}`;
    const existing = best.get(key);
    if (!existing || KIND_RANK[item.kind] < KIND_RANK[existing.kind]) {
      best.set(key, item);
    }
  }
  return [...best.values()];
}

export function buildManagerDashboard(
  team: TeamOnboarding,
  milestones: readonly Milestone[],
  resources: readonly Resource[],
  now: string,
): ManagerDashboard {
  const reports = team.members
    .map((member) => buildReport(member, milestones, resources, now))
    .sort((a, b) => {
      const rank: Record<ReportStatus, number> = {
        blocked: 0,
        'at-risk': 1,
        'on-track': 2,
        'just-started': 3,
      };
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return a.vm.progressPercentage - b.vm.progressPercentage;
    });

  const attention = dedupeAttention(reports.flatMap(attentionItemsFor)).sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    const ad = a.dueDate ?? '9999';
    const bd = b.dueDate ?? '9999';
    return ad.localeCompare(bd);
  });

  const blocked = reports.filter((r) => r.status === 'blocked').length;
  const needAttention = reports.filter(
    (r) => r.status === 'blocked' || r.status === 'at-risk',
  ).length;
  const overdueTasks = reports.reduce((sum, r) => sum + r.overdueTasks.length, 0);
  const averageProgress =
    reports.length === 0
      ? 0
      : Math.round(reports.reduce((sum, r) => sum + r.vm.progressPercentage, 0) / reports.length);

  return {
    managerName: team.managerName,
    reports,
    totals: {
      reports: reports.length,
      onTrack: reports.filter((r) => r.status === 'on-track' || r.status === 'just-started').length,
      needAttention,
      blocked,
      overdueTasks,
      averageProgress,
      notYetReady: reports.filter((r) => !r.vm.readiness.ready).length,
    },
    attention,
    generatedAt: now,
  };
}

/** Everyone whose required tasks are all done — worth the manager knowing. */
export function readyReports(dashboard: ManagerDashboard): ReportOnboarding[] {
  return dashboard.reports.filter((r) => r.vm.readiness.ready);
}
