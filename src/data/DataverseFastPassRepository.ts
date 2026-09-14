/**
 * Dataverse adapter, built on the generated services `pa app add data-source`
 * produces (see src/generated/) — Microsoft's official Power Apps CLI for
 * Code Apps (https://aka.ms/pacodeapps). Each generated `<Table>Service`
 * wraps the real `@microsoft/power-apps` data client with typed
 * create/get/getAll/update/delete methods for that table; this file maps
 * those onto the FastPassRepository contract and the app's domain types.
 *
 * `src/generated/**` mirrors exactly what `pa app add data-source` writes
 * into a real project — regenerate it there with:
 *   pa app add data-source --connector dataverse --table fastpass_employee
 *   pa app add data-source --connector dataverse --table fastpass_employeetask
 *   pa app add data-source --connector dataverse --table fastpass_milestone
 *   pa app add data-source --connector dataverse --table fastpass_resource
 */

import { getContext } from '@microsoft/power-apps/app';
import type { IOperationResult } from '@microsoft/power-apps/data';

import { DEMO_EMPLOYEE_ID } from '../config/demoConfig';
import { applySignalsToTasks } from '../domain/detection';
import { selectManagerSummary } from '../domain/selectors';
import type { SignalReading } from '../domain/signals';
import type {
  Employee,
  EmployeeTask,
  JourneyStatus,
  ManagerSummary,
  Milestone,
  MilestoneId,
  Resource,
  ResourceType,
  TaskStatus,
  TeamOnboarding,
} from '../domain/types';
import type { Fastpass_employees } from '../generated/models/Fastpass_employeesModel';
import type { Fastpass_employeetasks } from '../generated/models/Fastpass_employeetasksModel';
import type { Fastpass_milestones } from '../generated/models/Fastpass_milestonesModel';
import type { Fastpass_resources } from '../generated/models/Fastpass_resourcesModel';
import { Fastpass_employeesService } from '../generated/services/Fastpass_employeesService';
import { Fastpass_employeetasksService } from '../generated/services/Fastpass_employeetasksService';
import { Fastpass_milestonesService } from '../generated/services/Fastpass_milestonesService';
import { Fastpass_resourcesService } from '../generated/services/Fastpass_resourcesService';
import type { FastPassDataSnapshot, FastPassRepository } from './FastPassRepository';

export class DataverseFastPassRepository implements FastPassRepository {
  private currentEmployeeId: string | null = null;

  async getCurrentEmployee(): Promise<Employee> {
    const context = await getContext();
    const upn = context.user.userPrincipalName;
    if (!upn) {
      throw new Error(
        'getContext() returned no userPrincipalName; cannot resolve the signed-in employee.',
      );
    }
    const rows = unwrap(
      await Fastpass_employeesService.getAll({
        filter: `fastpass_userprincipalname eq '${odataString(upn)}'`,
        top: 1,
      }),
      'getCurrentEmployee',
    );
    let row = rows[0];
    if (!row) {
      // Nobody has provisioned a row for this viewer — fall back to the demo
      // employee (Cesar Martinez) so anyone the app is shared with sees a
      // working demo instead of a hard error. A real onboarding rollout would
      // provision a row per employee (e.g. from an HR system sync) and treat
      // a missing row as a real error instead.
      const demoRows = unwrap(
        await Fastpass_employeesService.getAll({
          filter: `fastpass_employeecode eq '${odataString(DEMO_EMPLOYEE_ID)}'`,
          top: 1,
        }),
        'getCurrentEmployee (demo fallback)',
      );
      row = demoRows[0];
      if (!row) {
        throw new Error(
          `No fastpass_employees row found for userPrincipalName "${upn}", and no demo ` +
            `employee "${DEMO_EMPLOYEE_ID}" exists to fall back to.`,
        );
      }
    }
    this.currentEmployeeId = row.fastpass_employeeid;
    return toEmployee(row);
  }

  async getEmployeeTasks(employeeId: string): Promise<EmployeeTask[]> {
    const rows = unwrap(
      await Fastpass_employeetasksService.getAll({
        filter: `_fastpass_employee_value eq '${odataString(employeeId)}'`,
      }),
      'getEmployeeTasks',
    );
    return rows.map(toTask);
  }

  async getMilestones(): Promise<Milestone[]> {
    const rows = unwrap(await Fastpass_milestonesService.getAll(), 'getMilestones');
    return rows.map(toMilestone);
  }

  async getResources(): Promise<Resource[]> {
    const rows = unwrap(await Fastpass_resourcesService.getAll(), 'getResources');
    return rows.map(toResource);
  }

  async getSignals(_employeeId: string): Promise<SignalReading[]> {
    // Signals come from connected systems (Microsoft Graph, Intune, the LMS,
    // the ITSM tool) rather than Dataverse — out of scope for this adapter;
    // until one is wired in, tasks fall back to their stored fastpass_status.
    return [];
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<EmployeeTask> {
    await Fastpass_employeetasksService.update(taskId, {
      fastpass_status: status,
      fastpass_completeddate: status === 'Completed' ? new Date().toISOString() : undefined,
      fastpass_blockerflag: status === 'Blocked',
    });
    return toTask(unwrap(await Fastpass_employeetasksService.get(taskId), 'updateTaskStatus'));
  }

  async updateTaskBlocker(
    taskId: string,
    blockerFlag: boolean,
    description: string | null,
  ): Promise<EmployeeTask> {
    await Fastpass_employeetasksService.update(taskId, {
      fastpass_blockerflag: blockerFlag,
      fastpass_blockerdescription: blockerFlag ? (description ?? undefined) : undefined,
      fastpass_status: blockerFlag ? 'Blocked' : 'In Progress',
    });
    return toTask(unwrap(await Fastpass_employeetasksService.get(taskId), 'updateTaskBlocker'));
  }

  async getManagerSummary(employeeId: string): Promise<ManagerSummary> {
    const [employeeRow, tasks, milestones, resources] = await Promise.all([
      this.retrieveEmployee(employeeId),
      this.getEmployeeTasks(employeeId),
      this.getMilestones(),
      this.getResources(),
    ]);
    return selectManagerSummary(
      employeeRow,
      tasks,
      milestones,
      resources,
      new Date().toISOString(),
    );
  }

  async getTeamOnboarding(managerName: string): Promise<TeamOnboarding> {
    const rows = unwrap(
      await Fastpass_employeesService.getAll({
        filter: `fastpass_managername eq '${odataString(managerName)}'`,
      }),
      'getTeamOnboarding',
    );
    const members = await Promise.all(
      rows.map(async (row) => {
        const employee = toEmployee(row);
        const tasks = await this.getEmployeeTasks(employee.id);
        return { employee, tasks };
      }),
    );
    return { managerName, members };
  }

  async refresh(): Promise<FastPassDataSnapshot> {
    const employee = await this.getCurrentEmployee();
    const [tasks, milestones, resources, signals] = await Promise.all([
      this.getEmployeeTasks(employee.id),
      this.getMilestones(),
      this.getResources(),
      this.getSignals(employee.id),
    ]);
    return { employee, tasks: applySignalsToTasks(tasks, signals), milestones, resources, signals };
  }

  private async retrieveEmployee(employeeId: string): Promise<Employee> {
    if (employeeId === this.currentEmployeeId) {
      return this.getCurrentEmployee();
    }
    return toEmployee(unwrap(await Fastpass_employeesService.get(employeeId), 'retrieveEmployee'));
  }
}

function toEmployee(row: Fastpass_employees): Employee {
  return {
    id: row.fastpass_employeeid,
    employeeId: row.fastpass_employeecode ?? '',
    displayName: row.fastpass_fullname ?? '',
    role: row.fastpass_role ?? '',
    department: row.fastpass_department ?? '',
    team: row.fastpass_team ?? '',
    managerName: row.fastpass_managername ?? '',
    journeyStatus: (row.fastpass_journeystatus as JourneyStatus | undefined) ?? 'Not Started',
    progressPercentage: row.fastpass_progresspercentage ?? 0,
    currentMilestone: row.fastpass_currentmilestone ?? '',
    startDate: row.fastpass_startdate ?? '',
    lastActivityDate: row.fastpass_lastactivitydate ?? '',
  };
}

function toTask(row: Fastpass_employeetasks): EmployeeTask {
  return {
    id: row.fastpass_employeetaskid,
    employeeId: row._fastpass_employee_value ?? '',
    name: row.fastpass_taskname ?? '',
    description: row.fastpass_description ?? '',
    status: (row.fastpass_status as TaskStatus | undefined) ?? 'Not Started',
    dueDate: row.fastpass_duedate ?? null,
    completedDate: row.fastpass_completeddate ?? null,
    blockerFlag: row.fastpass_blockerflag ?? false,
    blockerDescription: row.fastpass_blockerdescription ?? null,
    required: row.fastpass_required ?? true,
    category: row.fastpass_category ?? '',
    recommendedResourceId: row.fastpass_recommendedresourceid ?? null,
    notes: row.fastpass_notes ?? null,
  };
}

function toMilestone(row: Fastpass_milestones): Milestone {
  return {
    id: (row.fastpass_milestonecode ?? '') as MilestoneId,
    name: row.fastpass_milestonename ?? '',
    description: row.fastpass_description ?? '',
    taskNames: splitLines(row.fastpass_tasknames),
  };
}

function toResource(row: Fastpass_resources): Resource {
  return {
    id: row.fastpass_resourcecode ?? '',
    name: row.fastpass_resourcename ?? '',
    description: row.fastpass_description ?? '',
    type: (row.fastpass_type as ResourceType | undefined) ?? 'Article',
    url: row.fastpass_url ?? '',
    relatedTaskNames: splitLines(row.fastpass_relatedtasknames),
  };
}

function splitLines(value: string | null | undefined): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Escapes a value for a single-quoted OData string literal (`'` -> `''`). */
function odataString(value: string): string {
  return value.replace(/'/g, "''");
}

function unwrap<T>(result: IOperationResult<T>, context: string): T {
  if (!result.success) {
    const detail =
      result.error instanceof Error
        ? result.error.message
        : result.error
          ? JSON.stringify(result.error)
          : 'unknown error';
    throw new Error(`Dataverse call failed in DataverseFastPassRepository.${context}: ${detail}`);
  }
  return result.data;
}
