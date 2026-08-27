import { describe, expect, it } from 'vitest';
import {
  calculateProgressPercentage,
  calculateReadiness,
  compareByDueDateAscending,
  countTasksByStatus,
  deriveJourneyStatus,
  deriveMilestoneStatus,
  getRecommendedNextSteps,
  getTasksDueSoon,
  groupTasksByStatus,
} from './businessRules';
import { makeTask } from './testFactories';

describe('calculateProgressPercentage', () => {
  it('returns 0 when there are no required tasks (no divide by zero)', () => {
    expect(calculateProgressPercentage([])).toBe(0);
    expect(calculateProgressPercentage([makeTask({ required: false, status: 'Completed' })])).toBe(
      0,
    );
  });

  it('counts only required tasks and rounds to a whole number', () => {
    const tasks = [
      makeTask({ required: true, status: 'Completed' }),
      makeTask({ required: true, status: 'Completed' }),
      makeTask({ required: true, status: 'In Progress' }),
      makeTask({ required: false, status: 'Not Started' }),
    ];
    // 2 of 3 required complete => 66.67 => 67
    expect(calculateProgressPercentage(tasks)).toBe(67);
  });

  it('is 100 when every required task is complete', () => {
    const tasks = [makeTask({ status: 'Completed' }), makeTask({ status: 'Completed' })];
    expect(calculateProgressPercentage(tasks)).toBe(100);
  });
});

describe('deriveJourneyStatus', () => {
  it('maps 0 to Not Started', () => {
    expect(deriveJourneyStatus(0)).toBe('Not Started');
  });
  it('maps 1..99 to In Progress', () => {
    expect(deriveJourneyStatus(1)).toBe('In Progress');
    expect(deriveJourneyStatus(50)).toBe('In Progress');
    expect(deriveJourneyStatus(99)).toBe('In Progress');
  });
  it('maps 100 to Completed', () => {
    expect(deriveJourneyStatus(100)).toBe('Completed');
  });
});

describe('compareByDueDateAscending', () => {
  it('sorts earlier dates first', () => {
    expect(
      compareByDueDateAscending({ dueDate: '2026-01-01' }, { dueDate: '2026-02-01' }),
    ).toBeLessThan(0);
  });
  it('puts tasks without a due date last regardless of order', () => {
    expect(compareByDueDateAscending({ dueDate: null }, { dueDate: '2026-02-01' })).toBeGreaterThan(
      0,
    );
    expect(compareByDueDateAscending({ dueDate: '2026-02-01' }, { dueDate: null })).toBeLessThan(0);
  });
});

describe('getRecommendedNextSteps', () => {
  it('excludes completed, orders Blocked > In Progress > Not Started, then by due date, returns two', () => {
    const notStartedSoon = makeTask({ status: 'Not Started', dueDate: '2026-01-05' });
    const notStartedLater = makeTask({ status: 'Not Started', dueDate: '2026-03-05' });
    const inProgress = makeTask({ status: 'In Progress', dueDate: '2026-02-05' });
    const blocked = makeTask({ status: 'Blocked', dueDate: '2026-04-05' });
    const completed = makeTask({ status: 'Completed', dueDate: '2026-01-01' });

    const result = getRecommendedNextSteps([
      completed,
      notStartedLater,
      inProgress,
      notStartedSoon,
      blocked,
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(blocked);
    expect(result[1]).toBe(inProgress);
    expect(result).not.toContain(completed);
  });

  it('orders by earliest due date within the same status', () => {
    const a = makeTask({ status: 'Not Started', dueDate: '2026-05-01' });
    const b = makeTask({ status: 'Not Started', dueDate: '2026-01-01' });
    const result = getRecommendedNextSteps([a, b]);
    expect(result[0]).toBe(b);
    expect(result[1]).toBe(a);
  });

  it('returns an empty array when everything is complete', () => {
    expect(getRecommendedNextSteps([makeTask({ status: 'Completed' })])).toEqual([]);
  });
});

describe('groupTasksByStatus', () => {
  it('returns all four keys and sorts each section by due date with undated last', () => {
    const groups = groupTasksByStatus([
      makeTask({ status: 'Not Started', dueDate: null, name: 'undated' }),
      makeTask({ status: 'Not Started', dueDate: '2026-02-01', name: 'feb' }),
      makeTask({ status: 'Not Started', dueDate: '2026-01-01', name: 'jan' }),
    ]);
    expect(Object.keys(groups).sort()).toEqual(
      ['Blocked', 'Completed', 'In Progress', 'Not Started'].sort(),
    );
    expect(groups['Not Started'].map((task) => task.name)).toEqual(['jan', 'feb', 'undated']);
    expect(groups.Blocked).toEqual([]);
  });
});

describe('deriveMilestoneStatus', () => {
  it('is Not Started for an empty milestone', () => {
    expect(deriveMilestoneStatus([])).toBe('Not Started');
  });
  it('is Blocked when any task is blocked, even if others are complete', () => {
    expect(
      deriveMilestoneStatus([makeTask({ status: 'Completed' }), makeTask({ status: 'Blocked' })]),
    ).toBe('Blocked');
  });
  it('is Complete only when every task is complete', () => {
    expect(
      deriveMilestoneStatus([makeTask({ status: 'Completed' }), makeTask({ status: 'Completed' })]),
    ).toBe('Complete');
  });
  it('is In Progress when at least one task is completed or in progress', () => {
    expect(
      deriveMilestoneStatus([
        makeTask({ status: 'In Progress' }),
        makeTask({ status: 'Not Started' }),
      ]),
    ).toBe('In Progress');
    expect(
      deriveMilestoneStatus([
        makeTask({ status: 'Completed' }),
        makeTask({ status: 'Not Started' }),
      ]),
    ).toBe('In Progress');
  });
  it('is Not Started when all tasks are not started', () => {
    expect(
      deriveMilestoneStatus([
        makeTask({ status: 'Not Started' }),
        makeTask({ status: 'Not Started' }),
      ]),
    ).toBe('Not Started');
  });
});

describe('calculateReadiness', () => {
  it('is not ready while any required task is incomplete and reports remaining count', () => {
    const result = calculateReadiness([
      makeTask({ status: 'Completed' }),
      makeTask({ status: 'In Progress' }),
      makeTask({ status: 'Blocked' }),
    ]);
    expect(result.ready).toBe(false);
    expect(result.label).toBe('Onboarding In Progress');
    expect(result.tasksRemaining).toBe(2);
  });

  it('is ready only when every required task is complete', () => {
    const result = calculateReadiness([
      makeTask({ status: 'Completed' }),
      makeTask({ status: 'Completed' }),
      makeTask({ status: 'Not Started', required: false }),
    ]);
    expect(result.ready).toBe(true);
    expect(result.label).toBe('Ready for Production Work');
    expect(result.tasksRemaining).toBe(0);
  });

  it('is not ready when there are no required tasks at all', () => {
    expect(calculateReadiness([]).ready).toBe(false);
  });
});

describe('countTasksByStatus', () => {
  it('always returns all four keys', () => {
    const counts = countTasksByStatus([makeTask({ status: 'Completed' })]);
    expect(counts).toEqual({
      Blocked: 0,
      'In Progress': 0,
      'Not Started': 0,
      Completed: 1,
    });
  });
});

describe('getTasksDueSoon', () => {
  it('returns the earliest incomplete tasks, undated last', () => {
    const result = getTasksDueSoon(
      [
        makeTask({ status: 'Completed', dueDate: '2026-01-01' }),
        makeTask({ status: 'Not Started', dueDate: null, name: 'undated' }),
        makeTask({ status: 'In Progress', dueDate: '2026-02-01', name: 'feb' }),
        makeTask({ status: 'Not Started', dueDate: '2026-01-15', name: 'jan' }),
      ],
      2,
    );
    expect(result.map((task) => task.name)).toEqual(['jan', 'feb']);
  });
});
