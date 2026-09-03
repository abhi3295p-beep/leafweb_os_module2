"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { requireAuthenticatedUser } from "@/lib/auth";
import type { AIActivityLog } from "@prisma/client";

export interface CreateAITaskInput {
  aiEmployeeId: string;
  taskType: string; // "qualify_lead", "score_lead", "enrich_lead", etc
  priority?: number;
  resourceType?: string;
  resourceId?: string;
  input?: Record<string, unknown>;
  requiresApproval?: boolean;
  scheduledFor?: Date;
}

export async function createAITask(input: CreateAITaskInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    // Verify AI employee exists
    const employee = await prisma.aIEmployee.findUnique({
      where: { id: input.aiEmployeeId },
    });

    if (!employee) {
      return { success: false, error: "employee-not-found" };
    }

    const task = await prisma.aITask.create({
      data: {
        aiEmployeeId: input.aiEmployeeId,
        taskType: input.taskType,
        priority: input.priority || 0,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        input: input.input ? (input.input as Prisma.InputJsonValue) : undefined,
        requiresApproval: input.requiresApproval || false,
      status: input.requiresApproval ? "PENDING_APPROVAL" : "PENDING",
        scheduledFor: input.scheduledFor,
      },
    });

    // Log activity
    await logAIActivity(input.aiEmployeeId, "task_created", `Task ${task.id} created`, {
      taskType: input.taskType,
      priority: input.priority,
    });

    return { success: true, data: task };
  } catch (error) {
    console.error("Create AI task error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function updateAITaskStatus(
  taskId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PENDING_APPROVAL" | "CANCELLED",
  output?: Record<string, unknown>,
  error?: string
) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "not-found" };
    }

    const updateData: Prisma.AITaskUpdateInput = {
      status,
      error,
      startedAt: status === "IN_PROGRESS" ? new Date() : undefined,
      completedAt:
        status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
    };

    if (output) {
      updateData.output = output as Prisma.InputJsonValue;
    }

    const updated = await prisma.aITask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Log activity
    await logAIActivity(
      task.aiEmployeeId,
      "task_updated",
      `Task ${taskId} status changed to ${status}`,
      { status, error }
    );

    return { success: true, data: updated };
  } catch (error) {
    console.error("Update AI task status error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function getAITask(taskId: string) {
  try {
    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
      include: {
        aiEmployee: true,
        approval: true,
      },
    });

    return task;
  } catch (error) {
    console.error("Get AI task error:", error);
    return null;
  }
}

export async function listAITasks(
  employeeId?: string,
  status?: string,
  take: number = 50
) {
  try {
    const where: Prisma.AITaskWhereInput = {};
    if (employeeId) {
      where.aiEmployeeId = employeeId;
    }
    if (status) {
      where.status = status as any;
    }

    const tasks = await prisma.aITask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        aiEmployee: true,
        approval: true,
      },
    });

    return tasks;
  } catch (error) {
    console.error("List AI tasks error:", error);
    return [];
  }
}

export async function getAITaskStats(employeeId: string) {
  try {
    const [pending, inProgress, completed, failed] = await Promise.all([
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "PENDING" },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "IN_PROGRESS" },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "COMPLETED" },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: employeeId, status: "FAILED" },
      }),
    ]);

    return { pending, inProgress, completed, failed };
  } catch (error) {
    console.error("Get AI task stats error:", error);
    return null;
  }
}

export async function deleteAITask(taskId: string) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "not-found" };
    }

    await prisma.aITask.delete({
      where: { id: taskId },
    });

    await logAIActivity(task.aiEmployeeId, "task_deleted", `Task ${taskId} deleted`);

    return { success: true };
  } catch (error) {
    console.error("Delete AI task error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function logAIActivity(
  employeeId: string,
  action: string,
  summary: string,
  metadata?: Record<string, unknown>
): Promise<AIActivityLog | null> {
  try {
    return await prisma.aIActivityLog.create({
      data: {
        aiEmployeeId: employeeId,
        action,
        summary,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("Log AI activity error:", error);
    return null;
  }
}

export async function executeAITask(taskId: string) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
      include: { aiEmployee: true },
    });

    if (!task) {
      return { success: false, error: "not-found" };
    }

    // Approval gate: tasks requiring approval must never execute directly.
    if (task.requiresApproval && task.status === "PENDING_APPROVAL") {
      return {
        success: false,
        error: "approval-required",
        taskId: task.id,
        status: task.status,
      };
    }

    await updateAITaskStatus(taskId, "IN_PROGRESS");

    const { executeLocalAI } = await import("@/lib/ai-executor");

    const input =
      task.input && typeof task.input === "object"
        ? JSON.stringify(task.input)
        : "{}";

    const result = await executeLocalAI({
      system: `You are ${task.aiEmployee.name}, an AI employee for LEAFWEB.
Your role is ${task.aiEmployee.type}.
Perform the requested task carefully and return a concise, useful result.
Do not claim that you performed an external action unless the system confirms it.`,
      prompt: `Task type: ${task.taskType}

Task input:
${input}`,
      temperature: 0.2,
    });

    await updateAITaskStatus(taskId, "COMPLETED", {
      text: result.text,
      model: result.model,
      durationMs: result.durationMs,
    });

    await logAIActivity(
      task.aiEmployeeId,
      "task_executed",
      `Task ${taskId} executed successfully with local AI`,
      {
        taskType: task.taskType,
        model: result.model,
        durationMs: result.durationMs,
      },
    );

    return {
      success: true,
      data: {
        taskId,
        output: result.text,
        model: result.model,
        durationMs: result.durationMs,
      },
    };
  } catch (error) {
    console.error("Execute AI task error:", error);

    try {
      await updateAITaskStatus(
        taskId,
        "FAILED",
        undefined,
        error instanceof Error ? error.message : "AI execution failed",
      );
    } catch (updateError) {
      console.error("Failed to update AI task after execution error:", updateError);
    }

    return {
      success: false,
      error: "ai-execution-failed",
    };
  }
}
