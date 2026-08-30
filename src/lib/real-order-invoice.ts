import { prisma } from "../../db";

import type { AuthenticatedUser } from "@/lib/auth";
import { ensureClientAccess, ensurePermission, requireDatabase } from "@/lib/db-guard";
import { PERMISSIONS } from "@/lib/permissions";

export function calculateInvoiceTotals(subtotal: number, tax: number) {
  const normalizedSubtotal = Number(subtotal);
  const normalizedTax = Number(tax ?? 0);

  if (!Number.isFinite(normalizedSubtotal) || normalizedSubtotal <= 0) {
    throw new Error("Subtotal must be greater than zero");
  }

  return {
    subtotal: normalizedSubtotal,
    tax: normalizedTax,
    total: normalizedSubtotal + normalizedTax,
  };
}

export async function createOrderRecord(
  user: AuthenticatedUser,
  input: {
    clientId: string;
    serviceId: string;
    packageId?: string | null;
    description: string;
    budget?: number | null;
    deadline?: string | null;
    features?: string[];
    notes?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.ORDER_CREATE);
  ensureClientAccess(user, input.clientId);

  return prisma.order.create({
    data: {
      clientId: input.clientId,
      createdById: user.id,
      serviceId: input.serviceId,
      packageId: input.packageId ?? null,
      description: input.description,
      budget: input.budget ?? null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      features: input.features ?? [],
      notes: input.notes ?? null,
      status: "SUBMITTED",
    },
  });
}

export async function createInvoiceRecord(
  user: AuthenticatedUser,
  input: {
    clientId: string;
    orderId: string;
    subtotal: number;
    tax?: number;
    dueAt?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.INVOICE_WRITE);
  ensureClientAccess(user, input.clientId);

  const totals = calculateInvoiceTotals(input.subtotal, input.tax ?? 0);
  const invoiceNumber = `INV-${input.clientId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  return prisma.invoice.create({
    data: {
      number: invoiceNumber,
      clientId: input.clientId,
      projectId: null,
      status: "DRAFT",
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    },
  });
}

export async function approveOrder(user: AuthenticatedUser, orderId: string) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.ORDER_APPROVE);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  ensureClientAccess(user, order.clientId);

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "APPROVED" },
  });
}

export async function convertOrderToProject(user: AuthenticatedUser, orderId: string, projectName: string) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.ORDER_CONVERT);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  ensureClientAccess(user, order.clientId);

  const project = await prisma.project.create({
    data: {
      name: projectName,
      description: order.description,
      clientId: order.clientId,
      budget: order.budget,
      status: "NEW",
      progress: 0,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONVERTED", projectId: project.id },
  });

  return project;
}
