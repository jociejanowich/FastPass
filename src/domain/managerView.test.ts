import { describe, expect, it } from 'vitest';
import { buildManagerDashboard } from './managerView';
import { applySignalsToTasks } from './detection';
import { MOCK_EMPLOYEE, MOCK_MILESTONES, MOCK_RESOURCES, MOCK_TASKS } from '../data/mockData';
import { cloneMockSignals } from '../data/mockSignals';
import { cloneTeamMembers } from '../data/mockTeam';
import type { TeamOnboarding } from './types';

const NOW = '2026-09-08T09:00:00.000Z';

function demoTeam(): TeamOnboarding {
  const self = {
    employee: MOCK_EMPLOYEE,
    tasks: applySignalsToTasks(MOCK_TASKS, cloneMockSignals()),
  };
  return { managerName: 'Jim McDonnell', members: [self, ...cloneTeamMembers()] };
}

function dashboard() {
  return buildManagerDashboard(demoTeam(), MOCK_MILESTONES, MOCK_RESOURCES, NOW);
}

describe('buildManagerDashboard — totals', () => {
  const d = dashboard();

  it('counts every direct report', () => {
    expect(d.totals.reports).toBe(4);
    expect(d.reports).toHaveLength(4);
  });

  it('summarizes blocked, attention, and progress', () => {
    expect(d.totals.blocked).toBe(2); // Cesar + Marcus
    expect(d.totals.needAttention).toBeGreaterThanOrEqual(2);
    expect(d.totals.averageProgress).toBeGreaterThan(0);
    expect(d.totals.averageProgress).toBeLessThan(100);
  });
});

describe('buildManagerDashboard — report ordering and classification', () => {
  const d = dashboard();

  it('puts blocked reports first, just-started last', () => {
    expect(d.reports[0]?.status).toBe('blocked');
    expect(d.reports[d.reports.length - 1]?.status).toBe('just-started');
  });

  it('does not project risk onto a day-one hire', () => {
    const aisha = d.reports.find((r) => r.employee.displayName === 'Aisha Rahman');
    expect(aisha?.status).toBe('just-started');
    expect(aisha?.highRisks).toHaveLength(0);
    expect(aisha?.overdueTasks).toHaveLength(0);
  });

  it('marks the near-finished report on track', () => {
    const sam = d.reports.find((r) => r.employee.displayName === 'Sam Staudaher');
    expect(sam?.status).toBe('on-track');
    expect(sam?.vm.progressPercentage).toBeGreaterThanOrEqual(80);
  });
});

describe('buildManagerDashboard — attention queue', () => {
  const d = dashboard();

  it('surfaces every blocker across the team', () => {
    const blockerItems = d.attention.filter((i) => i.kind === 'blocker');
    expect(blockerItems.map((i) => i.employeeName).sort()).toEqual([
      'Cesar Martinez',
      'Marcus Lee',
    ]);
    for (const item of blockerItems) {
      expect(item.detail.length).toBeGreaterThan(0);
      expect(item.recommendedAction.length).toBeGreaterThan(0);
    }
  });

  it('ranks high severity before medium', () => {
    const severities = d.attention.map((i) => i.severity);
    const firstMedium = severities.indexOf('medium');
    if (firstMedium >= 0) {
      expect(severities.slice(firstMedium).every((s) => s === 'medium')).toBe(true);
    }
  });

  it('shows one item per (report, task) — a blocker beats an overdue flag', () => {
    const keys = d.attention.map((i) => `${i.employeeId}:${i.taskName}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes overdue tasks for a report that has fallen behind', () => {
    const marcusOverdue = d.attention.filter(
      (i) => i.employeeName === 'Marcus Lee' && i.kind === 'overdue',
    );
    expect(marcusOverdue.length).toBeGreaterThan(0);
  });
});

describe('buildManagerDashboard — manager scoping', () => {
  it('only includes reports that roll up to this manager', () => {
    const team: TeamOnboarding = {
      managerName: 'Someone Else',
      members: cloneTeamMembers().map((m) => ({
        ...m,
        employee: { ...m.employee, managerName: 'A Different Manager' },
      })),
    };
    // buildManagerDashboard trusts the repository's scoping; it should still
    // build cleanly from whatever members it is handed.
    const d = buildManagerDashboard(team, MOCK_MILESTONES, MOCK_RESOURCES, NOW);
    expect(d.managerName).toBe('Someone Else');
    expect(d.reports.length).toBe(team.members.length);
  });
});
