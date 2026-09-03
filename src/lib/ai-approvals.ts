"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { requireAuthenticatedUser, canUserAccess } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { executeAITask, logAIActivity } from "./ai-tasks";

export interface CreateAIApprovalInput {
  taskId: string;
  aiEmployeeId: string;
  requiredApprovers: string[]; // role slugs or user IDs
}

export async function createAIApproval(input: CreateAIApprovalInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    // Verify task exists
    const task = await prisma.aITask.findUnique({
      where: { id: input.taskId },
    });

    if (!task) {
      return { success: false, error: "task-not-found" };
    }

    const approval = await prisma.aIApproval.create({
      data: {
        taskId: input.taskId,
        aiEmployeeId: input.aiEmployeeId,
        requiredApprovers: input.requiredApprovers,
      },
    });

    await logAIActivity(
      input.aiEmployeeId,
      "approval_created",
      `Approval required for task ${input.taskId}`,
    );

    return { success: true, data: approval };
  } catch (error) {
    console.error("Create AI approval error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function approveAITask(
  approvalId: string,
  notes?: string,
) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    // Approval is an execution-authorizing action.
    if (!(await canUserAccess(user, PERMISSIONS.AI_APPROVE))) {
      return { success: false, error: "Permission denied" };
    }

    const approval = await prisma.aIApproval.findUnique({
      where: { id: approvalId },
      include: { task: true },
    });

    if (!approval) {
      return { success: false, error: "approval-not-found" };
    }

    if (approval.status !== "PENDING") {
      return {
        success: false,
        error: "approval-not-pending",
        status: approval.status,
      };
    }

    if (approval.task.status !== "PENDING_APPROVAL") {
      return {
        success: false,
        error: "task-not-awaiting-approval",
        status: approval.task.status,
      };
    }

    // Mark approval as approved first.
    const updated = await prisma.aIApproval.update({
      where: { id: approvalId },
      data: {
        status: "APPROVED",
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    });

    await logAIActivity(
      approval.aiEmployeeId,
      "approval_approved",
      `Approval ${approvalId} approved by ${user.name}`,
      { approverName: user.name, notes },
    );

    // Release approved task for execution.
    await prisma.aITask.update({
      where: { id: approval.taskId },
      data: { status: "PENDING" },
    });

    // Route execution through the real execution function.
    const execution = await executeAITask(approval.taskId);

    if (!execution.success) {
      return {
        success: false,
        error: execution.error || "execution-failed-after-approval",
        approval: updated,
        execution,
      };
    }

    return {
      success: true,
      data: updated,
      execution,
    };
  } catch (error) {
    console.error("Approve AI task error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function rejectAITask(
  approvalId: string,
  rejectionReason: string,
) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.AI_EXECUTE))) {
      return { success: false, error: "Permission denied" };
    }

    const approval = await prisma.aIApproval.findUnique({
      where: { id: approvalId },
      include: { task: true },
    });

    if (!approval) {
      return { success: false, error: "approval-not-found" };
    }

    // Update approval
    const updated = await prisma.aIApproval.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectionReason,
      },
    });

    // Update task to failed
    await prisma.aITask.update({
      where: { id: approval.taskId },
      data: {
        status: "FAILED",
        result: "rejected",
        error: `Rejected by ${user.name}: ${rejectionReason}`,
        completedAt: new Date(),
      },
    });

    await logAIActivity(
      approval.aiEmployeeId,
      "approval_rejected",
      `Approval ${approvalId} rejected by ${user.name}`,
      { rejectionReason },
    );

    return { success: true, data: updated };
  } catch (error) {
    console.error("Reject AI task error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function getAIApproval(approvalId: string) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.AI_READ))) {
      return { success: false, error: "Permission denied" };
    }

    const approval = await prisma.aIApproval.findUnique({
      where: { id: approvalId },
      include: {
        task: true,
        aiEmployee: true,
      },
    });

    if (!approval) {
      return { success: false, error: "approval-not-found" };
    }

    return { success: true, data: approval };
  } catch (error) {
    console.error("Get AI approval error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function getApprovalStats(employeeId: string) {
  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma.aIApproval.count({
        where: { aiEmployeeId: employeeId, status: "PENDING" },
      }),
      prisma.aIApproval.count({
        where: { aiEmployeeId: employeeId, status: "APPROVED" },
      }),
      prisma.aIApproval.count({
        where: { aiEmployeeId: employeeId, status: "REJECTED" },
      }),
    ]);

    return { pending, approved, rejected };
  } catch (error) {
    console.error("Get approval stats error:", error);
    return null;
  }
}