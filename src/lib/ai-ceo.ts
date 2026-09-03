"use server";

import { prisma } from "../../db";
import { requireAuthenticatedUser, canUserAccess } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAITask } from "@/lib/ai-tasks";
import { executeLocalAI } from "@/lib/ai-executor";
import { createAIApproval } from "@/lib/ai-approvals";

type CEOPlan = {
  decision: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  delegateTo:
    | "lead_generator"
    | "sales"
    | "project_manager"
    | "ceo";
  taskType: string;
  reasoning: string;
};

function parseCEOPlan(rawResponse: string): CEOPlan {
  const raw = rawResponse.trim();

  if (!raw) {
    throw new Error("Gemini returned an empty CEO response.");
  }

  console.log("[AI CEO] RAW RESPONSE:", raw);

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1) {
      throw new Error(
        "No valid JSON object found in CEO response.",
      );
    }

    if (end === -1 || end <= start) {
      console.error(
        "[AI CEO] Incomplete JSON response:",
        cleaned,
      );

      throw new Error(
        "CEO response contains incomplete JSON.",
      );
    }

    const jsonText = cleaned.slice(start, end + 1);

    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch (error) {
      console.error(
        "[AI CEO] JSON PARSE ERROR:",
        error,
      );

      throw new Error(
        "CEO response contains invalid JSON.",
      );
    }
  }

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

  return {
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
}

export async function runAICEO(objective: string) {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      error: "auth-required",
    };
  }

  if (!(await canUserAccess(user, PERMISSIONS.AI_EXECUTE))) {
    return {
      success: false,
      error: "Permission denied",
    };
  }

  if (!objective.trim()) {
    return {
      success: false,
      error: "objective-required",
    };
  }

  const ceo = await prisma.aIEmployee.findFirst({
    where: {
      type: "ceo",
      isActive: true,
    },
  });

  if (!ceo) {
    return {
      success: false,
      error: "ai-ceo-not-found",
    };
  }

  const employees = await prisma.aIEmployee.findMany({
    where: {
      isActive: true,
      type: {
        in: [
          "lead_generator",
          "sales",
          "project_manager",
        ],
      },
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
        `${employee.name} | type=${employee.type} | status=${employee.status} | capabilities=${JSON.stringify(
          employee.capabilities,
        )}`,
    )
    .join("\n");

  let result;

  try {
    result = await executeLocalAI({
      system: `You are LEAFWEB AI CEO.

Analyze the business objective and choose ONE AI employee.

Available AI employees:
${employeeContext}

Return ONLY this JSON object:

{
  "decision": "short decision",
  "priority": "HIGH",
  "delegateTo": "lead_generator",
  "taskType": "lead_generation",
  "reasoning": "short reason"
}

Rules:
- Output valid JSON only.
- No markdown.
- No code fences.
- No extra fields.
- decision: maximum 8 words.
- reasoning: maximum 12 words.
- taskType: maximum 3 words.
- priority must be LOW, MEDIUM, HIGH, or CRITICAL.
- delegateTo must be lead_generator, sales, project_manager, or ceo.
- Choose the employee that best matches the objective.
- Never claim an external action was completed.`,
      prompt: `Business objective:

${objective}`,
      temperature: 0.1,
      maxTokens: 1024,
      timeoutMs: 180000,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gemini AI execution failed.";

    console.error(
      "[AI CEO] Gemini execution failed:",
      error,
    );

    return {
      success: false,
      error: "local-ai-unavailable",
      message,
    };
  }

  let plan: CEOPlan;

  try {
    plan = parseCEOPlan(result.text);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid CEO response.";

    console.error(
      "[AI CEO] Invalid response:",
      message,
    );

    return {
      success: false,
      error: "ceo-invalid-response",
      message,
      raw: result.text,
    };
  }

  const delegatedEmployee =
    plan.delegateTo === "ceo"
      ? ceo
      : employees.find(
          (employee) =>
            employee.type === plan.delegateTo,
        );

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
    taskType:
      plan.taskType || "ceo_delegated_task",
    priority:
      priorityMap[plan.priority] ?? 5,
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

  const approval = await createAIApproval({
    taskId: task.data.id,
    aiEmployeeId: delegatedEmployee.id,
    requiredApprovers: ["admin"],
  });

  if (!approval.success) {
    return {
      success: false,
      error:
        approval.error ||
        "approval-creation-failed",
      plan,
      task: task.data,
    };
  }

  await prisma.aIActivityLog.create({
    data: {
      aiEmployeeId: ceo.id,
      action: "task_delegated",
      summary: `CEO delegated "${plan.taskType}" to ${delegatedEmployee.name}`,
      metadata: {
        objective,
        delegatedEmployeeId:
          delegatedEmployee.id,
        delegatedEmployeeType:
          delegatedEmployee.type,
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
    approval: approval.data,
    model: result.model,
    durationMs: result.durationMs,
  };
}