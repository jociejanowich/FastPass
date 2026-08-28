import { describe, expect, it } from 'vitest';
import { analyzeProfile } from './profileAnalysis';
import { applySignalsToTasks } from './detection';
import { MOCK_EMPLOYEE, MOCK_MILESTONES, MOCK_RESOURCES, MOCK_TASKS } from '../data/mockData';
import { cloneMockSignals } from '../data/mockSignals';
import { makeTask } from './testFactories';
import type { Employee } from './types';

const NOW = '2026-09-08T09:00:00.000Z';

function demoAnalysis() {
  const tasks = applySignalsToTasks(MOCK_TASKS, cloneMockSignals());
  return analyzeProfile({
    employee: MOCK_EMPLOYEE,
    tasks,
    milestones: MOCK_MILESTONES,
    resources: MOCK_RESOURCES,
    now: NOW,
  });
}

describe('analyzeProfile — profile summary', () => {
  const a = demoAnalysis();

  it('is grounded in supplied employee facts only', () => {
    expect(a.profileSummary).toContain('Cesar Martinez');
    expect(a.profileSummary).toContain('Junior Software Engineer');
    expect(a.profileSummary).toContain('Software Development');
    expect(a.profileSummary).toContain('50%');
  });

  it('is a concise multi-sentence profile, not a wall of text', () => {
    const sentences = a.profileSummary.split(/(?<=\.)\s/).filter(Boolean);
    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences.length).toBeLessThanOrEqual(6);
  });
});

describe('analyzeProfile — strengths and development areas', () => {
  const a = demoAnalysis();

  it('returns 3–5 strengths, each with its own evidence', () => {
    expect(a.strengths.length).toBeGreaterThanOrEqual(3);
    expect(a.strengths.length).toBeLessThanOrEqual(5);
    for (const item of a.strengths) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.evidence.length).toBeGreaterThan(0);
    }
  });

  it('credits completing required training (evidence-backed)', () => {
    const training = a.strengths.find((s) => /training/i.test(s.label));
    expect(training?.evidence).toMatch(/Security Training|Compliance Training/);
  });

  it('returns 3–5 development areas phrased constructively', () => {
    expect(a.developmentAreas.length).toBeGreaterThanOrEqual(3);
    expect(a.developmentAreas.length).toBeLessThanOrEqual(5);
    const text = a.developmentAreas.map((d) => `${d.label} ${d.evidence}`).join(' ');
    expect(text).not.toMatch(/\b(lazy|careless|weak|incompetent|bad at|will fail)\b/i);
  });

  it('surfaces the blocker and the access delay as development areas', () => {
    const labels = a.developmentAreas.map((d) => `${d.label} ${d.evidence}`).join(' | ');
    expect(labels).toMatch(/escalat/i);
    expect(labels).toMatch(/external approval|approver/i);
  });
});

describe('analyzeProfile — skills, learning, performance', () => {
  const a = demoAnalysis();

  it('fills all three skills categories', () => {
    expect(a.skillsSnapshot.demonstrated.length).toBeGreaterThan(0);
    expect(a.skillsSnapshot.developing.length).toBeGreaterThan(0);
    expect(a.skillsSnapshot.recommended.length).toBeGreaterThan(0);
  });

  it('gives every learning area a reason', () => {
    expect(a.learningAreas.length).toBeGreaterThanOrEqual(3);
    for (const area of a.learningAreas) {
      expect(area.topic.length).toBeGreaterThan(0);
      expect(area.reason.length).toBeGreaterThan(0);
    }
  });

  it('summarizes performance without labeling the employee negatively', () => {
    expect(a.performanceSummary).toMatch(/50%/);
    expect(a.performanceSummary).not.toMatch(/\b(poor|failing|underperform)\b/i);
  });
});

describe('analyzeProfile — career', () => {
  const a = demoAnalysis();

  it('offers 1–3 possible directions, each with a reason and skills', () => {
    expect(a.careerDirections.length).toBeGreaterThanOrEqual(1);
    expect(a.careerDirections.length).toBeLessThanOrEqual(3);
    for (const d of a.careerDirections) {
      expect(d.path.length).toBeGreaterThan(0);
      expect(d.whyItFits.length).toBeGreaterThan(0);
      expect(d.skillsToDevelop.length).toBeGreaterThan(0);
    }
    expect(a.careerDirections[0]?.path).toBe('Software Engineering');
  });

  it('builds a trajectory anchored on the real current role', () => {
    expect(a.careerTrajectory.current).toBe('Junior Software Engineer');
    expect(a.careerTrajectory.nextStepRoles).toContain('Software Engineer');
    expect(a.careerTrajectory.longerTerm.length).toBeGreaterThan(0);
  });
});

describe('analyzeProfile — upcoming risks', () => {
  const a = demoAnalysis();

  it('returns at most 3 risk cards, ranked highest risk first', () => {
    expect(a.upcomingRisks.length).toBeLessThanOrEqual(3);
    const order = { High: 3, Medium: 2, Low: 1 } as const;
    for (let i = 1; i < a.upcomingRisks.length; i += 1) {
      expect(order[a.upcomingRisks[i - 1]!.level]).toBeGreaterThanOrEqual(
        order[a.upcomingRisks[i]!.level],
      );
    }
  });

  it('flags the access request as HIGH, matched to the earlier stalled dependency', () => {
    const top = a.upcomingRisks[0]!;
    expect(top.taskName).toBe('Request Required Access');
    expect(top.level).toBe('High');
    expect(top.rationale.toLowerCase()).toMatch(/setup laptop|another team|someone else|approver/);
    expect(top.sharedComponents.length).toBeGreaterThan(0);
    expect(top.nextSteps.length).toBeGreaterThan(0);
    expect(top.learningPlan.length).toBeGreaterThan(0);
    expect(top.support.length).toBeGreaterThan(0);
  });

  it('does not list a currently-blocked task as an upcoming risk', () => {
    expect(a.upcomingRisks.map((r) => r.taskName)).not.toContain('Setup Laptop');
  });

  it('rates a task with no similar prior difficulty as LOW', () => {
    const employee: Employee = { ...MOCK_EMPLOYEE };
    const tasks = [
      makeTask({
        name: 'Complete Security Training',
        status: 'Completed',
        category: 'Training & Compliance',
      }),
      makeTask({
        name: 'Meet Manager',
        status: 'Not Started',
        category: 'Account Setup',
        dueDate: NOW,
      }),
    ];
    const result = analyzeProfile({
      employee,
      tasks,
      milestones: MOCK_MILESTONES,
      resources: MOCK_RESOURCES,
      now: NOW,
    });
    const meet = result.upcomingRisks.find((r) => r.taskName === 'Meet Manager');
    expect(meet?.level).toBe('Low');
  });
});
