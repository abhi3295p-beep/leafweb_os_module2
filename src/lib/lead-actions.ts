"use server";

import { type LeadStatus } from "@prisma/client";

import { requireAuthenticatedUser, canUserAccess } from "@/lib/auth";
import { PERMISSIONS, ROLE_SLUGS } from "@/lib/permissions";
import { prisma } from "../../db";

export type CreateLeadInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: string;
  location?: string;
  message: string;
  source?: string;
  serviceId?: string;
};

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  status?: string;
  qualification?: string;
  assignedToId?: string | null;
  notes?: string;
  nextFollowUpAt?: string;
};

export type CreateLeadResult =
  | { success: true; leadId: string }
  | { success: false; error: string };

export type UpdateLeadResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function createLeadAction(
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_WRITE))) {
      return { success: false, error: "unauthorized" };
    }

    if (!input.name || !input.email || !input.message) {
      return { success: false, error: "missing-required-fields" };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { success: false, error: "invalid-email" };
    }

    const lead = await prisma.lead.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        company: input.company || null,
        website: input.website || null,
        industry: input.industry || null,
        location: input.location || null,
        message: input.message,
        source: input.source || null,
        serviceId: input.serviceId || null,
        clientId: user.clientId || null,
        status: "NEW",
        qualification: "UNQUALIFIED",
      },
    });

    // Log activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "created",
        summary: `Lead created: ${lead.name}`,
        actorId: user.id,
      },
    });

    return { success: true, leadId: lead.id };
  } catch (error) {
    console.error("Create lead error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function updateLeadAction(
  leadId: string,
  input: UpdateLeadInput
): Promise<UpdateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_WRITE))) {
      return { success: false, error: "unauthorized" };
    }

    // Get existing lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "not-found" };
    }

    // Check if user owns the lead (for Lead Generators)
    if (user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR && lead.assignedToId !== user.id) {
      return { success: false, error: "unauthorized" };
    }

    const updateData: any = {};

    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.website !== undefined) updateData.website = input.website;
    if (input.industry !== undefined) updateData.industry = input.industry;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.message) updateData.message = input.message;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.status) updateData.status = input.status;
    if (input.qualification) updateData.qualification = input.qualification;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId;
    if (input.nextFollowUpAt) updateData.nextFollowUpAt = new Date(input.nextFollowUpAt);

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    // Log activity
    const changes = Object.keys(updateData).filter(k => updateData[k] !== lead[k as keyof typeof lead]);
    if (changes.length > 0) {
      await prisma.leadActivity.create({
        data: {
          leadId: leadId,
          type: "updated",
          summary: `Lead updated: ${changes.join(", ")}`,
          actorId: user.id,
          metadata: { changedFields: changes },
        },
      });
    }

    return { success: true, message: "Lead updated successfully" };
  } catch (error) {
    console.error("Update lead error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function contactLeadAction(
  leadId: string,
  notes?: string
): Promise<UpdateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_WRITE))) {
      return { success: false, error: "unauthorized" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "not-found" };
    }

    if (user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR && lead.assignedToId !== user.id) {
      return { success: false, error: "unauthorized" };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "CONTACTED",
        contactAttempts: { increment: 1 },
        lastContactedAt: new Date(),
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: leadId,
        type: "contacted",
        summary: "Lead contacted",
        details: notes || undefined,
        actorId: user.id,
      },
    });

    return { success: true, message: "Lead marked as contacted" };
  } catch (error) {
    console.error("Contact lead error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function qualifyLeadAction(
  leadId: string,
  score: number,
  notes?: string
): Promise<UpdateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_QUALIFY))) {
      return { success: false, error: "unauthorized" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "not-found" };
    }

    if (user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR && lead.assignedToId !== user.id) {
      return { success: false, error: "unauthorized" };
    }

    const qualification = score >= 70 ? "QUALIFIED" : score >= 40 ? "QUALIFIED" : "UNQUALIFIED";

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "QUALIFIED",
        qualification: qualification,
        qualificationScore: score,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: leadId,
        type: "qualified",
        summary: `Lead qualified with score ${score}`,
        details: notes || undefined,
        actorId: user.id,
        metadata: { score },
      },
    });

    return { success: true, message: "Lead qualified successfully" };
  } catch (error) {
    console.error("Qualify lead error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function assignLeadAction(
  leadId: string,
  assignedToId: string
): Promise<UpdateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_ASSIGN))) {
      return { success: false, error: "unauthorized" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "not-found" };
    }

    // Verify assigned user exists and has LEAD_GENERATOR role
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      include: { role: true },
    });

    if (!assignedUser || assignedUser.role.slug !== ROLE_SLUGS.LEAD_GENERATOR) {
      return { success: false, error: "invalid-user" };
    }

    const previousAssignee = lead.assignedToId;

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedToId: assignedToId,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: leadId,
        type: "assigned",
        summary: `Lead assigned to ${assignedUser.name}`,
        actorId: user.id,
        metadata: { previousAssignee, newAssignee: assignedToId },
      },
    });

    return { success: true, message: "Lead assigned successfully" };
  } catch (error) {
    console.error("Assign lead error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function scheduleFollowUpAction(
  leadId: string,
  nextFollowUpAt: string,
  notes?: string
): Promise<UpdateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_WRITE))) {
      return { success: false, error: "unauthorized" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "not-found" };
    }

    if (user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR && lead.assignedToId !== user.id) {
      return { success: false, error: "unauthorized" };
    }

    const followUpDate = new Date(nextFollowUpAt);
    if (isNaN(followUpDate.getTime())) {
      return { success: false, error: "invalid-date" };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextFollowUpAt: followUpDate,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: leadId,
        type: "follow_up_scheduled",
        summary: `Follow-up scheduled for ${followUpDate.toLocaleDateString()}`,
        details: notes || undefined,
        actorId: user.id,
        metadata: { scheduledFor: followUpDate.toISOString() },
      },
    });

    return { success: true, message: "Follow-up scheduled successfully" };
  } catch (error) {
    console.error("Schedule follow-up error:", error);
    return { success: false, error: "server-error" };
  }
}

import type { Prisma } from "@prisma/client";

export async function changeLeadStatusAction(
  leadId: string,
  status: string
): Promise<UpdateLeadResult> {
  try {
    const user = await requireAuthenticatedUser();

    if (!user) {
      return { success: false, error: "auth-required" };
    }

    if (!(await canUserAccess(user, PERMISSIONS.LEAD_WRITE))) {
      return { success: false, error: "unauthorized" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "not-found" };
    }

    if (user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR && lead.assignedToId !== user.id) {
      return { success: false, error: "unauthorized" };
    }

    const validStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "MEETING_BOOKED", "PROPOSAL_SENT", "WON", "LOST"];
    if (!validStatuses.includes(status as LeadStatus)) {
      return { success: false, error: "invalid-status" };
    }

    const nextStatus = status as LeadStatus;

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: nextStatus,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: leadId,
        type: "status_changed",
        summary: `Status changed to ${status}`,
        actorId: user.id,
        metadata: { previousStatus: lead.status, newStatus: status },
      },
    });

    return { success: true, message: `Lead status changed to ${status}` };
  } catch (error) {
    console.error("Change lead status error:", error);
    return { success: false, error: "server-error" };
  }
}
