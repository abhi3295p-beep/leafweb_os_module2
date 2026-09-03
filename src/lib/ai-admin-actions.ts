"use server";

import { requireAuthenticatedUser, canUserAccess } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAITask, executeAITask } from "@/lib/ai-tasks";
import { prisma } from "../../db";

export async function runAIEmployeeTest(
  employeeId: string,
  instruction?: string,
) {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return { success: false, error: "auth-required" };
  }

  if (!(await canUserAccess(user, PERMISSIONS.AI_EXECUTE))) {
    return { success: false, error: "Permission denied" };
  }

  const employee = await prisma.aIEmployee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    return { success: false, error: "AI employee not found" };
  }

  if (!employee.isActive) {
    return { success: false, error: "AI employee is inactive" };
  }

  const defaultInstruction =
    employee.type === "lead_generator"
      ? "Act as the LEAFWEB Lead Generator AI. Explain briefly how you would qualify and prioritize a new B2B lead."
      : employee.type === "sales"
        ? "Act as the LEAFWEB Sales AI. Explain briefly how you would prepare a qualified B2B opportunity for outreach."
        : "Act as the LEAFWEB Project Manager AI. Explain briefly how you would monitor a project and identify delivery risks.";

  const taskResult = await createAITask({
    aiEmployeeId: employee.id,
    taskType: "local_ai_test",
    input: {
      instruction: instruction || defaultInstruction,
    },
    requiresApproval: false,
  });

  if (!taskResult.success || !("data" in taskResult) || !taskResult.data) {
    return {
      success: false,
      error: taskResult.error || "Failed to create AI task",
    };
  }

  return executeAITask(taskResult.data.id);
}
