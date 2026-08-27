/**
 * FastPass Assistant — deterministic local response engine.
 *
 * This is a MOCK response engine. It inspects live mock state and returns
 * contextual answers with no external calls. It can later be swapped for Azure
 * OpenAI, Microsoft Copilot Studio, or another approved service behind the same
 * `generateAssistantReply` signature.
 */

import { formatDate, formatDueRelative } from '../utils/date';
import { getBlockedTasks, getRecommendedNextSteps, getTasksDueSoon } from './businessRules';
import {
  findResourceForTask,
  resolveResource,
  selectCurrentMilestoneName,
  type EmployeeViewModel,
} from './selectors';
import type { EmployeeTask, Milestone, Resource } from './types';

export type AssistantIntent =
  | 'next-steps'
  | 'blockers'
  | 'due-soon'
  | 'milestone'
  | 'resource'
  | 'manager'
  | 'progress'
  | 'fallback';

export interface AssistantCitation {
  label: string;
  url: string;
  description: string;
}

export interface AssistantReply {
  intent: AssistantIntent;
  text: string;
  citations: AssistantCitation[];
}

export interface AssistantContext {
  employee: EmployeeViewModel;
  tasks: EmployeeTask[];
  milestones: Milestone[];
  resources: Resource[];
}

interface IntentRule {
  intent: AssistantIntent;
  keywords: string[];
}

/** Ordered — the first rule whose keyword appears wins. */
const INTENT_RULES: IntentRule[] = [
  { intent: 'blockers', keywords: ['block', 'stuck', 'blocker', 'unblock'] },
  {
    intent: 'next-steps',
    keywords: ['next', 'work on', 'should i do', 'start with', 'focus on', 'priorit'],
  },
  { intent: 'due-soon', keywords: ['due', 'soon', 'deadline', 'overdue', 'this week'] },
  { intent: 'milestone', keywords: ['milestone', 'working toward', 'phase', 'stage'] },
  { intent: 'manager', keywords: ['manager', 'escalate', 'escalation', 'my boss'] },
  {
    intent: 'resource',
    keywords: ['resource', 'read', 'documentation', 'guide', 'learn', 'wiki', 'article'],
  },
  {
    intent: 'progress',
    keywords: ['progress', 'how am i doing', 'percent', 'status', 'on track'],
  },
];

export function detectIntent(message: string): AssistantIntent {
  const normalized = message.toLowerCase();
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.intent;
    }
  }
  return 'fallback';
}

function citationFor(resource: Resource | null): AssistantCitation[] {
  if (!resource) return [];
  return [{ label: resource.name, url: resource.url, description: resource.description }];
}

function taskResource(context: AssistantContext, task: EmployeeTask): Resource | null {
  return (
    resolveResource(context.resources, task.recommendedResourceId) ??
    findResourceForTask(context.resources, task.name)
  );
}

function describeTask(task: EmployeeTask): string {
  return `“${task.name}” (${task.status}, ${formatDueRelative(task.dueDate)}, due ${formatDate(
    task.dueDate,
  )})`;
}

function answerNextSteps(context: AssistantContext): AssistantReply {
  const blocked = getBlockedTasks(context.tasks);
  const steps = getRecommendedNextSteps(context.tasks, 2);
  const citations: AssistantCitation[] = [];
  const lines: string[] = [];

  if (blocked.length > 0) {
    const first = blocked[0]!;
    const resource = taskResource(context, first);
    citations.push(...citationFor(resource));
    lines.push(
      `Start with your blocker: ${describeTask(first)}. ${first.blockerDescription ?? ''}`.trim(),
    );
    lines.push('Clearing this first matters because it is holding up the rest of that milestone.');
  }

  const remaining = steps.filter((task) => task.status !== 'Blocked');
  if (remaining.length > 0) {
    lines.push(`Then focus on: ${remaining.map((task) => describeTask(task)).join(' and ')}.`);
    for (const task of remaining) {
      const resource = taskResource(context, task);
      if (resource && !citations.some((c) => c.url === resource.url)) {
        citations.push(...citationFor(resource));
      }
    }
  }

  if (lines.length === 0) {
    return answerAllClear(context);
  }

  return { intent: 'next-steps', text: lines.join('\n\n'), citations };
}

function answerBlockers(context: AssistantContext): AssistantReply {
  const blocked = getBlockedTasks(context.tasks);
  if (blocked.length === 0) {
    return {
      intent: 'blockers',
      text: 'Nothing is blocked right now. Every task is either done or actively moving. Keep going with your recommended next steps.',
      citations: [],
    };
  }
  const citations: AssistantCitation[] = [];
  const lines = blocked.map((task) => {
    const resource = taskResource(context, task);
    if (resource) citations.push(...citationFor(resource));
    return [
      `• ${describeTask(task)}`,
      `  Why: ${task.blockerDescription ?? 'Blocked and awaiting action.'}`,
      `  Do this: ${
        task.name === 'Setup Laptop'
          ? 'Follow up on the open hardware request and ask IT for a loaner device so you can keep working.'
          : 'Raise it with your manager and use the linked resource to move it forward.'
      }`,
    ].join('\n');
  });
  return {
    intent: 'blockers',
    text: `You have ${blocked.length} blocked task${blocked.length > 1 ? 's' : ''}:\n\n${lines.join(
      '\n\n',
    )}`,
    citations,
  };
}

function answerDueSoon(context: AssistantContext): AssistantReply {
  const dueSoon = getTasksDueSoon(context.tasks, 3);
  if (dueSoon.length === 0) {
    return answerAllClear(context);
  }
  const lines = dueSoon.map((task) => `• ${describeTask(task)}`);
  return {
    intent: 'due-soon',
    text: `Your earliest incomplete tasks are:\n\n${lines.join('\n')}`,
    citations: [],
  };
}

function answerMilestone(context: AssistantContext): AssistantReply {
  const current = selectCurrentMilestoneName(context.milestones, context.tasks);
  const milestone = context.milestones.find((m) => m.name === current);
  const milestoneTasks = milestone
    ? milestone.taskNames
        .map((name) => context.tasks.find((task) => task.name === name))
        .filter((task): task is EmployeeTask => task !== undefined)
    : [];
  const outstanding = milestoneTasks.filter((task) => task.status !== 'Completed');
  const lines = [
    `You are working toward the “${current}” milestone.`,
    milestone ? milestone.description : '',
    outstanding.length > 0
      ? `Outstanding in this milestone:\n${outstanding
          .map((task) => `• ${describeTask(task)}`)
          .join('\n')}`
      : 'Every task in this milestone is complete.',
  ].filter(Boolean);
  return { intent: 'milestone', text: lines.join('\n\n'), citations: [] };
}

function answerResource(context: AssistantContext): AssistantReply {
  const focus = getBlockedTasks(context.tasks)[0] ?? getRecommendedNextSteps(context.tasks, 1)[0];
  if (!focus) {
    return answerAllClear(context);
  }
  const resource = taskResource(context, focus);
  if (!resource) {
    return {
      intent: 'resource',
      text: `The most relevant task right now is ${describeTask(
        focus,
      )}, but there is no linked resource for it. Ask your manager or check the engineering wiki.`,
      citations: citationFor(findResourceForTask(context.resources, 'Review Engineering Wiki')),
    };
  }
  return {
    intent: 'resource',
    text: `For your current focus — ${describeTask(focus)} — review “${resource.name}”. ${
      resource.description
    }`,
    citations: citationFor(resource),
  };
}

function answerManager(context: AssistantContext): AssistantReply {
  const blocked = getBlockedTasks(context.tasks);
  const { progressPercentage, journeyStatus } = context.employee;
  const lines = [
    `Your manager sees: ${progressPercentage}% overall progress, journey status “${journeyStatus}”.`,
  ];
  if (blocked.length > 0) {
    lines.push(
      `They receive an automated blocker alert for ${blocked
        .map((task) => `“${task.name}”`)
        .join(', ')}, including the blocker detail and a recommended action.`,
    );
    lines.push(
      'If it is not resolved before the due date, that is the point to ask them to step in.',
    );
  } else {
    lines.push('No blockers to escalate. The daily summary shows steady progress.');
  }
  return { intent: 'manager', text: lines.join('\n\n'), citations: [] };
}

function answerProgress(context: AssistantContext): AssistantReply {
  const { progressPercentage, journeyStatus, counts, readiness, currentMilestone } =
    context.employee;
  const lines = [
    `You are ${progressPercentage}% through onboarding — journey status “${journeyStatus}”.`,
    `Tasks: ${counts.Completed} completed, ${counts['In Progress']} in progress, ${counts['Not Started']} not started, ${counts.Blocked} blocked.`,
    `Current milestone: ${currentMilestone}.`,
    readiness.ready
      ? 'You are ready for production work.'
      : `${readiness.tasksRemaining} required task${
          readiness.tasksRemaining === 1 ? '' : 's'
        } remain before you are ready for production work.`,
  ];
  return { intent: 'progress', text: lines.join('\n\n'), citations: [] };
}

function answerAllClear(context: AssistantContext): AssistantReply {
  return {
    intent: 'next-steps',
    text: `Everything on your list is complete — ${context.employee.progressPercentage}% progress. You are ready for production work. Check the Career Journey page for what comes next.`,
    citations: [],
  };
}

function answerFallback(context: AssistantContext): AssistantReply {
  return {
    intent: 'fallback',
    text: [
      'I can help with your onboarding. Try one of these:',
      '• What should I work on next?',
      '• What is blocking my progress?',
      '• What tasks are due soon?',
      '• What milestone am I working toward?',
      '• What resource should I review?',
      '• What does my manager need to know?',
      '',
      `For quick context: you are ${context.employee.progressPercentage}% through onboarding with ${context.employee.blockerCount} blocker(s).`,
    ].join('\n'),
    citations: [],
  };
}

export function generateAssistantReply(context: AssistantContext, message: string): AssistantReply {
  const intent = detectIntent(message);
  switch (intent) {
    case 'next-steps':
      return answerNextSteps(context);
    case 'blockers':
      return answerBlockers(context);
    case 'due-soon':
      return answerDueSoon(context);
    case 'milestone':
      return answerMilestone(context);
    case 'resource':
      return answerResource(context);
    case 'manager':
      return answerManager(context);
    case 'progress':
      return answerProgress(context);
    case 'fallback':
    default:
      return answerFallback(context);
  }
}

export const SUGGESTED_PROMPTS: string[] = [
  'What should I work on next?',
  'What is blocking my progress?',
  'What tasks are due soon?',
  'What milestone am I working toward?',
  'What resource should I review?',
  'What does my manager need to know?',
];
