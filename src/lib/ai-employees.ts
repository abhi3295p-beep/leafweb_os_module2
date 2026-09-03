"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { requireAuthenticatedUser, canUserAccess } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export type AIEmployeeType = "lead_generator" | "sales" | "project_manager";

export type AIEmployeeCapability =
  | "lead_qualification"
  | "lead_scoring"
  | "lead_enrichment"
  | "opportunity_tracking"
  | "proposal_assistance"
  | "project_monitoring"
  | "task_monitoring"
  | "milestone_tracking"
  | "risk_detection";

export interface CreateAIEmployeeInput {
  name: string;
  type: AIEmployeeType;
  displayName?: string;
  description?: string;
  capabilities: AIEmployeeCapability[];
  configuration?: Record<string, unknown>;
}

export interface UpdateAIEmployeeInput {
  name?: string;
  displayName?: string;
  description?: string;
  capabilities?: AIEmployeeCapability[];
  configuration?: Record<string, unknown>;
  status?: "IDLE" | "RUNNING" | "PAUSED" | "ERROR" | "MAINTENANCE";
  isActive?: boolean;
}

export async function createAIEmployee(input: CreateAIEmployeeInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.ADMIN_ACCESS))) {
      return { success: false, error: "unauthorized" };
    }

    const aiEmployee = await prisma.aIEmployee.create({
      data: {
        name: input.name,
        type: input.type,
        displayName: input.displayName || input.name,
        description: input.description,
        capabilities: input.capabilities,
        configuration: (input.configuration || {}) as Prisma.InputJsonValue,
      },
    });

    return { success: true, data: aiEmployee };
  } catch (error) {
    console.error("Create AI employee error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function updateAIEmployee(employeeId: string, input: UpdateAIEmployeeInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.ADMIN_ACCESS))) {
      return { success: false, error: "unauthorized" };
    }

    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return { success: false, error: "not-found" };
    }

    const updated = await prisma.aIEmployee.update({
      where: { id: employeeId },
      data: {
        name: input.name,
        displayName: input.displayName,
        description: input.description,
        capabilities: input.capabilities,
        configuration: input.configuration ? (input.configuration as Prisma.InputJsonValue) : undefined,
        status: input.status,
        isActive: input.isActive,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Update AI employee error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function getAIEmployee(employeeId: string) {
  try {
    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return employee;
  } catch (error) {
    console.error("Get AI employee error:", error);
    return null;
  }
}

export async function listAIEmployees(type?: AIEmployeeType) {
  try {
    const where: Prisma.AIEmployeeWhereInput = {};
    if (type) {
      where.type = type;
    }

    const employees = await prisma.aIEmployee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          where: { status: "IN_PROGRESS" },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    return employees;
  } catch (error) {
    console.error("List AI employees error:", error);
    return [];
  }
}

export async function getAIEmployeeStats(employeeId: string) {
  try {
    const employee = await prisma.aIEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return null;
    }

    const [totalTasks, completedTasks, failedTasks, pendingTasks, pendingApprovals] = await Promise.all([
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "COMPLETED" },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "FAILED" },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "PENDING" },
      }),
      prisma.aIApproval.count({
        where: {
          aiEmployeeId: employeeId,
          status: "PENDING",
        },
      }),
    ]);

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const successRate = (completedTasks + failedTasks) > 0 
      ? (completedTasks / (completedTasks + failedTasks)) * 100 
      : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks,
      pendingApprovals,
      completionRate,
      successRate,
    };
  } catch (error) {
    console.error("Get AI employee stats error:", error);
    return null;
  }
}

export async function deleteAIEmployee(employeeId: string) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.ADMIN_ACCESS))) {
      return { success: false, error: "unauthorized" };
    }

    await prisma.aIEmployee.delete({
      where: { id: employeeId },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete AI employee error:", error);
    return { success: false, error: "server-error" };
  }
}
