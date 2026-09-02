"use server";

import { prisma } from "../../db";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAITask } from "@/lib/ai-tasks";
import { executeLocalAI } from "@/lib/ai-executor";

type CEOPlan = {
  decision: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  delegateTo: "lead_generator" | "sales" | "project_manager" | "ceo";
  taskType: string;
  reasoning: string;
};

export async function runAICEO(objective: string) {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return { success: false, error: "auth-required" };
  }

  if (!objective.trim()) {
    return { success: false, error: "objective-required" };
  }

  const ceo = await prisma.aIEmployee.findFirst({
    where: { type: "ceo", isActive: true },
  });

  if (!ceo) {
    return { success: false, error: "ai-ceo-not-found" };
  }

  const employees = await prisma.aIEmployee.findMany({
    where: {
      isActive: true,
      type: { in: ["lead_generator", "sales", "project_manager"] },
    },
    select: {
      id: true,
      name: true,
      type: true,
      capabilities: true,
      status: true,
    },
  });

  const employeeContext = employees
    .map(
      (employee) =>
        `${employee.name} | type=${employee.type} | status=${employee.status} | capabilities=${JSON.stringify(employee.capabilities)}`,
    )
    .join("\n");

  let result;

  try {
    result = await executeLocalAI({
      system: `You are LEAFWEB AI CEO.

You are the top-level AI business orchestrator.

Your responsibilities:
- Analyze business objectives.
- Prioritize work.
- Delegate work to the correct AI employee.
- Coordinate Lead Generator AI, Sales AI, and Project Manager AI.
- Identify risks and bottlenecks.
- Never claim an external action was completed unless the system confirms it.
- Human approval is required for consequential external actions.

Available AI employees:
${employeeContext}

Return ONLY valid JSON with this structure:
{
  "decision": "short decision",
  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
  "delegateTo": "lead_generator|sales|project_manager|ceo",
  "taskType": "short_task_type",
  "reasoning": "short explanation"
}`,
      prompt: `Business objective:

${objective}`,
      temperature: 0.1,
      maxTokens: 256,
      timeoutMs: 180000,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Local AI execution failed.";

    return {
      success: false,
      error: "local-ai-unavailable",
      message,
    };
  }

  let plan: CEOPlan;

  try {
    const raw = result.text.trim();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON object found in AI response.");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    const priorityValue = String(
      parsed.priority ?? "MEDIUM",
    ).toUpperCase();

    const delegateValue = String(
      parsed.delegateTo ?? "ceo",
    ).toLowerCase();

    const delegateTo: CEOPlan["delegateTo"] =
      delegateValue.includes("lead")
        ? "lead_generator"
        : delegateValue.includes("sales")
          ? "sales"
          : delegateValue.includes("project")
            ? "project_manager"
            : "ceo";

    const priority: CEOPlan["priority"] =
      priorityValue === "CRITICAL" ||
      priorityValue === "HIGH" ||
      priorityValue === "MEDIUM" ||
      priorityValue === "LOW"
        ? priorityValue
        : "MEDIUM";

    plan = {
      decision: String(
        parsed.decision ?? "No decision provided.",
      ),
      priority,
      delegateTo,
      taskType: String(
        parsed.taskType ?? "ceo_delegated_task",
      ),
      reasoning: String(
        parsed.reasoning ?? "No reasoning provided.",
      ),
    };
  } catch {
    return {
      success: false,
      error: "ceo-invalid-response",
      raw: result.text,
    };
  }
  const delegatedEmployee =
    plan.delegateTo === "ceo"
      ? ceo
      : employees.find((employee) => employee.type === plan.delegateTo);

  if (!delegatedEmployee) {
    return {
      success: false,
      error: "delegated-employee-not-found",
      plan,
    };
  }

  const priorityMap = {
    LOW: 1,
    MEDIUM: 5,
    HIGH: 10,
    CRITICAL: 20,
  } as const;

  const task = await createAITask({
    aiEmployeeId: delegatedEmployee.id,
    taskType: plan.taskType || "ceo_delegated_task",
    priority: priorityMap[plan.priority] ?? 5,
    input: {
      objective,
      ceoDecision: plan.decision,
      reasoning: plan.reasoning,
      delegatedBy: ceo.id,
    },
    requiresApproval: true,
  });

  if (!task.success || !task.data) {
    return {
      success: false,
      error: task.error || "delegation-failed",
      plan,
    };
  }

  await prisma.aIActivityLog.create({
    data: {
      aiEmployeeId: ceo.id,
      action: "task_delegated",
      summary: `CEO delegated "${plan.taskType}" to ${delegatedEmployee.name}`,
      metadata: {
        objective,
        delegatedEmployeeId: delegatedEmployee.id,
        delegatedEmployeeType: delegatedEmployee.type,
        priority: plan.priority,
        decision: plan.decision,
        reasoning: plan.reasoning,
        taskId: task.data.id,
      },
    },
  });

  return {
    success: true,
    plan,
    delegatedTo: {
      id: delegatedEmployee.id,
      name: delegatedEmployee.name,
      type: delegatedEmployee.type,
    },
    task: task.data,
    model: result.model,
    durationMs: result.durationMs,
  };
}







