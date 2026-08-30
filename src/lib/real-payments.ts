import { prisma } from "../../db";

import type { AuthenticatedUser } from "@/lib/auth";
import { ensureClientAccess, ensurePermission, requireDatabase } from "@/lib/db-guard";
import { PERMISSIONS } from "@/lib/permissions";

export function createPaymentIdempotencyKey(invoiceId: string, providerRef: string) {
  return `${invoiceId}:${providerRef}`;
}

export async function createPaymentRecord(
  user: AuthenticatedUser,
  input: {
    invoiceId: string;
    clientId: string;
    amount: number;
    provider: "STRIPE" | "RAZORPAY" | "MANUAL";
    providerRef: string;
    idempotencyKey?: string;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.PAYMENT_WRITE);
  ensureClientAccess(user, input.clientId);

  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice) throw new Error("Invoice not found");

  const idempotencyKey = input.idempotencyKey ?? createPaymentIdempotencyKey(input.invoiceId, input.providerRef);
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (existing) return existing;

  return prisma.payment.create({
    data: {
      invoiceId: input.invoiceId,
      clientId: input.clientId,
      amount: input.amount,
      provider: input.provider,
      providerRef: input.providerRef,
      idempotencyKey,
      status: "PROCESSING",
    },
  });
}

export async function finalizePayment(
  user: AuthenticatedUser,
  paymentId: string,
  input: {
    status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
    paidAt?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.PAYMENT_WRITE);

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: input.status,
      paidAt: input.paidAt ? new Date(input.paidAt) : payment.paidAt,
    },
  });

  if (input.status === "SUCCEEDED") {
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: "PAID" },
    });
  }

  return updated;
}
