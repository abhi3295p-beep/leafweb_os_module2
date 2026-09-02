"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAITask, logAIActivity } from "./ai-tasks";
import { createAIApproval } from "./ai-approvals";

interface LeadQualificationInput {
  leadId: string;
  criteriaScore: number; // 0-100
  criteria: Record<string, boolean | string>;
}

interface LeadScoringInput {
  leadId: string;
  factors: Record<string, number>;
}

interface LeadAssignmentInput {
  leadId: string;
  targetUserId: string;
  reason: string;
}

/**
 * Lead Generator AI - Automatically qualifies leads based on provided criteria
 */
export async function qualifyLeadAI(input: LeadQualificationInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    // Get the Lead Generator AI employee
    const aiEmployee = await prisma.aIEmployee.findFirst({
      where: { type: "lead_generator", isActive: true },
    });

    if (!aiEmployee) {
      return { success: false, error: "ai-employee-not-found" };
    }

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      return { success: false, error: "lead-not-found" };
    }

    // Determine qualification based on score
    const qualification = input.criteriaScore >= 70 ? "QUALIFIED" : "UNQUALIFIED";

    // Create AI task
    const taskResult = await createAITask({
      aiEmployeeId: aiEmployee.id,
      taskType: "qualify_lead",
      priority: 1,
      resourceType: "lead",
      resourceId: input.leadId,
      input: {
        leadId: input.leadId,
        criteria: input.criteria,
        criteriaScore: input.criteriaScore,
      },
      requiresApproval: input.criteriaScore >= 70 && input.criteriaScore < 85, // Require approval for borderline cases
    });

    if (!taskResult.success) {
      return taskResult;
    }

    // Update lead qualification
    const updatedLead = await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        qualification,
        qualificationScore: input.criteriaScore,
      },
    });

    // Create approval if required
    if (input.criteriaScore >= 70 && input.criteriaScore < 85) {
      await createAIApproval({
        taskId: (taskResult.data as any).id,
        aiEmployeeId: aiEmployee.id,
        requiredApprovers: ["admin", "project_manager"],
      });
    }

    await logAIActivity(
      aiEmployee.id,
      "lead_qualified",
      `Lead ${input.leadId} qualified with score ${input.criteriaScore}`,
      { qualification, score: input.criteriaScore } as unknown as Record<string, unknown>
    );

    return { success: true, data: { task: taskResult.data, lead: updatedLead } };
  } catch (error) {
    console.error("Qualify lead AI error:", error);
    return { success: false, error: "server-error" };
  }
}

/**
 * Lead Generator AI - Scores a lead based on multiple factors
 */
export async function scoreLeadAI(input: LeadScoringInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    const aiEmployee = await prisma.aIEmployee.findFirst({
      where: { type: "lead_generator", isActive: true },
    });

    if (!aiEmployee) {
      return { success: false, error: "ai-employee-not-found" };
    }

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      return { success: false, error: "lead-not-found" };
    }

    // Calculate overall score from factors
    const scores = Object.values(input.factors);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Create AI task
    const taskResult = await createAITask({
      aiEmployeeId: aiEmployee.id,
      taskType: "score_lead",
      priority: 0,
      resourceType: "lead",
      resourceId: input.leadId,
      input: {
        leadId: input.leadId,
        factors: input.factors,
        overallScore,
      },
    });

    if (!taskResult.success) {
      return taskResult;
    }

    // Update lead score
    const updatedLead = await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        qualificationScore: overallScore,
      },
    });

    await logAIActivity(
      aiEmployee.id,
      "lead_scored",
      `Lead ${input.leadId} scored ${overallScore}`,
      { factors: input.factors }
    );

    return { success: true, data: { task: taskResult.data, lead: updatedLead } };
  } catch (error) {
    console.error("Score lead AI error:", error);
    return { success: false, error: "server-error" };
  }
}

/**
 * Lead Generator AI - Assigns leads to team members
 */
export async function assignLeadAI(input: LeadAssignmentInput) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    const aiEmployee = await prisma.aIEmployee.findFirst({
      where: { type: "lead_generator", isActive: true },
    });

    if (!aiEmployee) {
      return { success: false, error: "ai-employee-not-found" };
    }

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      return { success: false, error: "lead-not-found" };
    }

    // Verify target user exists and has lead_generator role
    const targetUser = await prisma.user.findUnique({
      where: { id: input.targetUserId },
      include: { role: true },
    });

    if (!targetUser || targetUser.role.slug !== "lead_generator") {
      return { success: false, error: "invalid-target-user" };
    }

    // Create AI task
    const taskResult = await createAITask({
      aiEmployeeId: aiEmployee.id,
      taskType: "assign_lead",
      priority: 1,
      resourceType: "lead",
      resourceId: input.leadId,
      input: {
        leadId: input.leadId,
        targetUserId: input.targetUserId,
        reason: input.reason,
      },
    });

    if (!taskResult.success) {
      return taskResult;
    }

    // Update lead assignment
    const updatedLead = await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        assignedToId: input.targetUserId,
      },
    });

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        type: "assigned",
        summary: `Lead assigned to ${targetUser.name} by AI`,
        actorId: aiEmployee.id,
        metadata: { reason: input.reason, aiAssignment: true },
      },
    });

    await logAIActivity(
      aiEmployee.id,
      "lead_assigned",
      `Lead ${input.leadId} assigned to ${targetUser.name}`,
      { targetUserId: input.targetUserId, reason: input.reason }
    );

    return { success: true, data: { task: taskResult.data, lead: updatedLead } };
  } catch (error) {
    console.error("Assign lead AI error:", error);
    return { success: false, error: "server-error" };
  }
}

/**
 * Lead Generator AI - Schedules follow-up for leads
 */
export async function scheduleFollowUpAI(leadId: string, daysFromNow: number = 3) {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    const aiEmployee = await prisma.aIEmployee.findFirst({
      where: { type: "lead_generator", isActive: true },
    });

    if (!aiEmployee) {
      return { success: false, error: "ai-employee-not-found" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "lead-not-found" };
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysFromNow);

    // Create AI task
    const taskResult = await createAITask({
      aiEmployeeId: aiEmployee.id,
      taskType: "schedule_followup",
      priority: 0,
      resourceType: "lead",
      resourceId: leadId,
      input: { leadId, daysFromNow },
      scheduledFor: followUpDate,
    });

    if (!taskResult.success) {
      return taskResult;
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextFollowUpAt: followUpDate,
      },
    });

    await logAIActivity(
      aiEmployee.id,
      "followup_scheduled",
      `Follow-up scheduled for lead ${leadId} on ${followUpDate.toLocaleDateString()}`,
      { daysFromNow }
    );

    return { success: true, data: { task: taskResult.data, lead: updatedLead } };
  } catch (error) {
    console.error("Schedule follow-up AI error:", error);
    return { success: false, error: "server-error" };
  }
}

/**
 * Get lead generator AI statistics
 */
export async function getLeadGeneratorAIStats() {
  try {
    const aiEmployee = await prisma.aIEmployee.findFirst({
      where: { type: "lead_generator", isActive: true },
    });

    if (!aiEmployee) {
      return null;
    }

    const [totalLeads, qualifiedLeads, assignedLeads, followupsScheduled] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { qualification: "QUALIFIED" } }),
      prisma.lead.count({ where: { assignedToId: { not: null } } }),
      prisma.lead.count({ where: { nextFollowUpAt: { not: null } } }),
    ]);

    const [totalTasks, completedTasks, failedTasks] = await Promise.all([
      prisma.aITask.count({ where: { aiEmployeeId: aiEmployee.id } }),
      prisma.aITask.count({
        where: { aiEmployeeId: aiEmployee.id, status: "COMPLETED" },
      }),
      prisma.aITask.count({
        where: { aiEmployeeId: aiEmployee.id, status: "FAILED" },
      }),
    ]);

    return {
      aiEmployee,
      leads: { totalLeads, qualifiedLeads, assignedLeads, followupsScheduled },
      tasks: { totalTasks, completedTasks, failedTasks },
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  } catch (error) {
    console.error("Get lead generator AI stats error:", error);
    return null;
  }
}
