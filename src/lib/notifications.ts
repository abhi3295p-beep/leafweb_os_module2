import { prisma } from "../../db";
import type { AuthenticatedUser } from "@/lib/auth";

export type NotificationType =
  | "new_lead"
  | "new_client"
  | "project_update"
  | "task_assigned"
  | "invoice_created"
  | "payment_received"
  | "approval_requested"
  | "ai_execution"
  | "automation_failed";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  resource?: { type?: string; id?: string },
): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        resourceType: resource?.type ?? null,
        resourceId: resource?.id ?? null,
      },
    });
  } catch {
    // Notification failure should not block the main workflow.
  }
}

export async function notifyUser(user: Partial<AuthenticatedUser>, type: NotificationType, title: string, body: string) {
  if (!user.id) return;
  await createNotification(user.id, type, title, body);
}
