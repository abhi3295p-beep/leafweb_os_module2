import { z } from "zod";

import { PERMISSIONS } from "@/lib/permissions";
import type { AuthenticatedUser } from "@/lib/auth";

export const AI_EMPLOYEE_TYPES = {
  LEAD_GENERATION: "lead_generation",
  SALES: "sales",
  PROJECT_MANAGER: "project_manager",
  SEO_MARKETING: "seo_marketing",
  DEVELOPMENT: "development",
} as const;

export const AI_TOOL_CATALOG = {
  LEAD_SEARCH: "lead_search",
  LEAD_CREATE: "lead_create",
  LEAD_QUALIFY: "lead_qualify",
  SALES_EMAIL: "sales_email",
  PROJECT_STATUS: "project_status",
  TASK_UPDATE: "task_update",
  SEO_ANALYTICS: "seo_analytics",
  DEVELOPMENT_QA: "development_qa",
} as const;

export const aiEmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(Object.values(AI_EMPLOYEE_TYPES) as [string, ...string[]]),
  role: z.string().min(1),
  scope: z.enum(["global", "client", "project"]).default("client"),
  permissions: z.array(z.enum(Object.values(PERMISSIONS) as [string, ...string[]])).default([]),
  approvedTools: z.array(z.enum(Object.values(AI_TOOL_CATALOG) as [string, ...string[]])).default([]),
});

export type AIEmployee = z.infer<typeof aiEmployeeSchema>;

export function authorizeAiTool(
  employee: Partial<AIEmployee>,
  action: string,
  requiredScope?: string,
): boolean {
  if (!employee.approvedTools?.includes(action as never)) return false;
  if (requiredScope && employee.scope && employee.scope !== requiredScope && employee.scope !== "global") {
    return false;
  }

  return true;
}

export function makeAiEmployeeSeed(): AIEmployee[] {
  return [
    {
      id: "ai-lead-gen",
      name: "Lead Generation AI",
      type: AI_EMPLOYEE_TYPES.LEAD_GENERATION,
      role: "lead_generation",
      scope: "client",
      permissions: [PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_WRITE, PERMISSIONS.CLIENT_READ],
      approvedTools: [AI_TOOL_CATALOG.LEAD_SEARCH, AI_TOOL_CATALOG.LEAD_CREATE, AI_TOOL_CATALOG.LEAD_QUALIFY],
    },
    {
      id: "ai-sales",
      name: "Sales AI",
      type: AI_EMPLOYEE_TYPES.SALES,
      role: "sales",
      scope: "client",
      permissions: [PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_WRITE, PERMISSIONS.MESSAGE_WRITE],
      approvedTools: [AI_TOOL_CATALOG.SALES_EMAIL],
    },
    {
      id: "ai-pm",
      name: "Project Manager AI",
      type: AI_EMPLOYEE_TYPES.PROJECT_MANAGER,
      role: "project_manager_ai",
      scope: "project",
      permissions: [PERMISSIONS.PROJECT_READ, PERMISSIONS.TASK_READ, PERMISSIONS.TASK_WRITE, PERMISSIONS.PROJECT_WRITE],
      approvedTools: [AI_TOOL_CATALOG.PROJECT_STATUS, AI_TOOL_CATALOG.TASK_UPDATE],
    },
  ];
}

export function enforceAiScope(user: AuthenticatedUser, employeeScope: string, requestedScopeId?: string | null): boolean {
  if (employeeScope === "global") return true;
  if (employeeScope === "client") return Boolean(user.clientId && requestedScopeId === user.clientId);
  if (employeeScope === "project") return Boolean(user.clientId || user.teamMemberId);
  return false;
}
