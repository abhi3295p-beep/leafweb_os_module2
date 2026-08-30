import { prisma } from "../../db";

import type { AuthenticatedUser } from "@/lib/auth";
import { requireDatabase } from "@/lib/db-guard";
import { AuthorizationError, PERMISSIONS } from "@/lib/permissions";

export const AI_TOOL_ALIASES = [
  "lead_search",
  "lead_create",
  "lead_qualify",
  "sales_email",
  "project_status",
  "task_update",
  "seo_analytics",
  "development_qa",
] as const;

export function authorizeAiTool(
  user: AuthenticatedUser,
  employeeScope: "global" | "client" | "project",
  requestedTool: string,
  sectorClientId?: string | null,
) {
  if (!AI_TOOL_ALIASES.includes(requestedTool as (typeof AI_TOOL_ALIASES)[number])) {
    throw new AuthorizationError("AI tool not approved");
  }

  if (employeeScope === "global") {
    return user.permissions.includes(PERMISSIONS.ADMIN_ACCESS) || user.permissions.includes(PERMISSIONS.ANALYTICS_READ);
  }

  if (employeeScope === "client") {
    if (user.clientId && sectorClientId && user.clientId === sectorClientId) return true;
    if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) return true;
    return false;
  }

  if (employeeScope === "project") {
    return user.permissions.includes(PERMISSIONS.PROJECT_READ) || user.permissions.includes(PERMISSIONS.PROJECT_READ_ASSIGNED) || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS);
  }

  return false;
}

export async function createAiExecutionRecord(
  user: AuthenticatedUser,
  input: {
    employeeId: string;
    tool: string;
    scope: "global" | "client" | "project";
    clientId?: string | null;
    projectId?: string | null;
    startedAt?: string;
    status?: "RUNNING" | "SUCCESS" | "FAILED";
  },
) {
  requireDatabase();

  if (!user.permissions.includes(PERMISSIONS.ADMIN_ACCESS) && !user.permissions.includes(PERMISSIONS.ANALYTICS_READ)) {
    throw new AuthorizationError("AI execution not authorized");
  }

  if (!authorizeAiTool(user, input.scope, input.tool, input.clientId)) {
    throw new AuthorizationError("AI tool authorization failed");
  }

  return prisma.activityEvent.create({
    data: {
      type: "AI_EXECUTION",
      summary: `${input.employeeId} used ${input.tool}`,
      projectId: input.projectId ?? null,
      actorId: user.id,
      resourceType: "ai_execution",
      resourceId: input.employeeId,
      metadata: {
        scope: input.scope,
        clientId: input.clientId ?? null,
        tool: input.tool,
        status: input.status ?? "RUNNING",
      },
    },
  });
}
