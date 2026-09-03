import { randomBytes } from "node:crypto";

import { prisma } from "../../db";

import { hashPassword, type AuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ensureClientAccess, ensurePermission, requireDatabase } from "@/lib/db-guard";

export async function listLeadsForUser(user: AuthenticatedUser) {
  requireDatabase();

  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  }

  if (user.clientId) {
    return prisma.lead.findMany({
      where: { clientId: user.clientId },
      orderBy: { createdAt: "desc" },
    });
  }

  ensurePermission(user, PERMISSIONS.LEAD_READ);
  return prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createLeadRecord(
  user: AuthenticatedUser,
  input: {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    message: string;
    serviceId?: string | null;
    clientId?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.LEAD_WRITE);
  ensureClientAccess(user, input.clientId ?? null);

  return prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      company: input.company ?? null,
      message: input.message,
      serviceId: input.serviceId ?? null,
      clientId: input.clientId ?? null,
      status: "NEW",
    },
  });
}

export async function updateLeadStatus(
  user: AuthenticatedUser,
  leadId: string,
  input: { status: "NEW" | "CONTACTED" | "QUALIFIED" | "MEETING_BOOKED" | "PROPOSAL_SENT" | "WON" | "LOST"; clientId?: string | null },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.LEAD_WRITE);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  ensureClientAccess(user, lead.clientId ?? input.clientId ?? null);

  return prisma.lead.update({
    where: { id: leadId },
    data: {
      status: input.status,
      clientId: input.clientId ?? lead.clientId,
    },
  });
}

export async function convertLeadToClientRecord(
  user: AuthenticatedUser,
  leadId: string,
  input: {
    companyName?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
    password?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.ORDER_CONVERT);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status !== "QUALIFIED" && lead.status !== "PROPOSAL_SENT") {
    throw new Error("Lead must be qualified before conversion");
  }

  const temporaryPassword = input.password?.trim() || randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  const client = lead.clientId
    ? await prisma.client.findUnique({ where: { id: lead.clientId } })
    : await prisma.client.create({
        data: {
          companyName: input.companyName ?? lead.company ?? "New Client",
          phone: input.phone ?? null,
          website: input.website ?? null,
          notes: input.notes ?? null,
          user: {
            create: {
              email: lead.email,
              passwordHash,
              name: lead.name,
              role: {
                connect: { slug: "client" },
              },
            },
          },
        },
      });

  if (!client) {
    throw new Error("Client creation failed");
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "WON",
      clientId: client.id,
    },
  });

  return { client, lead: updatedLead, generatedPassword: temporaryPassword };
}

export async function deleteLeadRecord(user: AuthenticatedUser, leadId: string) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.LEAD_WRITE);
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  ensureClientAccess(user, lead.clientId ?? null);

  return prisma.lead.update({
    where: { id: leadId },
    data: { deletedAt: new Date() },
  });
}
