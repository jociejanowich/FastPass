import { describe, expect, it } from 'vitest';
import { detectIntent, generateAssistantReply, type AssistantContext } from './assistantEngine';
import { selectEmployeeViewModel } from './selectors';
import { MOCK_MILESTONES, MOCK_RESOURCES } from '../data/mockData';
import type { Employee, EmployeeTask } from './types';
import { makeTask } from './testFactories';

const BASE_EMPLOYEE: Employee = {
  id: 'e1',
  employeeId: 'EMP-001',
  displayName: 'Test Employee',
  role: 'Junior Software Engineer',
  department: 'IT',
  team: 'Software Development',
  managerName: 'Demo Manager',
  journeyStatus: 'In Progress',
  progressPercentage: 0,
  currentMilestone: 'Account Setup',
  startDate: '2026-09-01T00:00:00.000Z',
  lastActivityDate: '2026-09-05T00:00:00.000Z',
};

function contextFrom(tasks: EmployeeTask[]): AssistantContext {
  return {
    employee: selectEmployeeViewModel(BASE_EMPLOYEE, tasks, MOCK_MILESTONES),
    tasks,
    milestones: MOCK_MILESTONES,
    resources: MOCK_RESOURCES,
  };
}

describe('detectIntent', () => {
  it('routes the six suggested prompts to distinct intents', () => {
    expect(detectIntent('What should I work on next?')).toBe('next-steps');
    expect(detectIntent('What is blocking my progress?')).toBe('blockers');
    expect(detectIntent('What tasks are due soon?')).toBe('due-soon');
    expect(detectIntent('What milestone am I working toward?')).toBe('milestone');
    expect(detectIntent('What resource should I review?')).toBe('resource');
    expect(detectIntent('What does my manager need to know?')).toBe('manager');
  });

  it('prefers the blocker intent over progress when both keywords appear', () => {
    expect(detectIntent('what is blocking my progress')).toBe('blockers');
  });

  it('falls back for unrecognized input', () => {
    expect(detectIntent('tell me a joke')).toBe('fallback');
  });
});

describe('generateAssistantReply — next steps', () => {
  it('mentions the blocker first, explains why, then recommends tasks with due dates and a resource', () => {
    const tasks = [
      makeTask({
        name: 'Setup Laptop',
        status: 'Blocked',
        blockerDescription: 'Awaiting hardware ticket HRDW-4821.',
        dueDate: '2026-09-02T00:00:00.000Z',
        recommendedResourceId: 'res-it-portal',
      }),
      makeTask({
        name: 'Request Required Access',
        status: 'In Progress',
        dueDate: '2026-09-09T00:00:00.000Z',
        recommendedResourceId: 'res-access-guide',
      }),
    ];
    const reply = generateAssistantReply(contextFrom(tasks), 'What should I work on next?');

    expect(reply.intent).toBe('next-steps');
    expect(reply.text).toContain('Setup Laptop');
    expect(reply.text.indexOf('Setup Laptop')).toBeLessThan(
      reply.text.indexOf('Request Required Access'),
    );
    expect(reply.text).toContain('HRDW-4821');
    expect(reply.text).toMatch(/Sep 9, 2026/);
    expect(reply.citations.some((c) => c.label === 'IT Equipment Portal')).toBe(true);
  });

  it('returns an all-clear response when nothing is outstanding', () => {
    const tasks = [makeTask({ status: 'Completed' })];
    const reply = generateAssistantReply(contextFrom(tasks), 'what should I do next');
    expect(reply.text.toLowerCase()).toContain('complete');
  });
});

describe('generateAssistantReply — blockers', () => {
  it('lists blocked tasks with descriptions, an action, and a resource', () => {
    const tasks = [
      makeTask({
        name: 'Setup Laptop',
        status: 'Blocked',
        blockerDescription: 'Awaiting hardware.',
        recommendedResourceId: 'res-it-portal',
      }),
    ];
    const reply = generateAssistantReply(contextFrom(tasks), 'what is blocking me');
    expect(reply.intent).toBe('blockers');
    expect(reply.text).toContain('Setup Laptop');
    expect(reply.text).toContain('Awaiting hardware.');
    expect(reply.text.toLowerCase()).toContain('loaner');
    expect(reply.citations).toHaveLength(1);
  });

  it('says nothing is blocked when there are no blockers', () => {
    const reply = generateAssistantReply(
      contextFrom([makeTask({ status: 'In Progress' })]),
      'anything blocked?',
    );
    expect(reply.text.toLowerCase()).toContain('nothing is blocked');
  });
});

describe('generateAssistantReply — due soon', () => {
  it('returns the earliest incomplete tasks', () => {
    const tasks = [
      makeTask({ name: 'Later', status: 'Not Started', dueDate: '2026-12-01T00:00:00.000Z' }),
      makeTask({ name: 'Sooner', status: 'Not Started', dueDate: '2026-09-15T00:00:00.000Z' }),
      makeTask({ name: 'Done', status: 'Completed', dueDate: '2026-09-01T00:00:00.000Z' }),
    ];
    const reply = generateAssistantReply(contextFrom(tasks), 'what is due soon?');
    expect(reply.intent).toBe('due-soon');
    expect(reply.text.indexOf('Sooner')).toBeLessThan(reply.text.indexOf('Later'));
    expect(reply.text).not.toContain('Done');
  });
});

describe('generateAssistantReply — fallback', () => {
  it('offers the suggested prompts', () => {
    const reply = generateAssistantReply(contextFrom([makeTask()]), 'hello there');
    expect(reply.intent).toBe('fallback');
    expect(reply.text).toContain('What should I work on next?');
  });
});
