import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { type AuthenticatedUser } from "@/lib/auth";

export type AuditAction =
  | "login"
  | "logout"
  | "auth_failed"
  | "permission_denied"
  | "client_access_attempt"
  | "crm_update"
  | "project_update"
  | "order_update"
  | "invoice_update"
  | "payment_event"
  | "file_access"
  | "ai_action"
  | "automation_action"
  | "admin_change";

export async function auditEvent(
  action: AuditAction,
  actor?: Partial<AuthenticatedUser> | null,
  details?: {
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;

    await prisma.auditLog.create({
      data: {
        action,
        actorId: actor?.id ?? null,
        resourceType: details?.resourceType ?? null,
        resourceId: details?.resourceId ?? null,
        ipAddress: details?.ipAddress ?? null,
        userAgent: details?.userAgent ?? null,
        metadata: (details?.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Safe failure: audit is important but must never block app execution.
  }
}
