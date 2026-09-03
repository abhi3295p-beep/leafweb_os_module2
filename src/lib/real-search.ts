import { prisma } from "../../db";

import type { AuthenticatedUser } from "@/lib/auth";
import { requireDatabase } from "@/lib/db-guard";
import { PERMISSIONS } from "@/lib/permissions";

export type SearchableResource =
  | "lead"
  | "client"
  | "project"
  | "order"
  | "invoice"
  | "payment"
  | "file"
  | "ai_execution";

export function buildSearchFilter(user: AuthenticatedUser, resource: SearchableResource) {
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return {} as Record<string, unknown>;
  }

  if (user.clientId) {
    if (resource === "lead" || resource === "project" || resource === "order" || resource === "invoice" || resource === "payment" || resource === "file") {
      return { clientId: user.clientId } as Record<string, unknown>;
    }
    return {} as Record<string, unknown>;
  }

  return { id: { in: [] } } as Record<string, unknown>;
}

export async function searchProtectedRecords(
  user: AuthenticatedUser,
  resource: SearchableResource,
  query: string,
) {
  requireDatabase();

  const term = query.trim();
  if (!term) return [];

  const filter = buildSearchFilter(user, resource);

  switch (resource) {
    case "lead":
      return prisma.lead.findMany({
        where: { ...filter, OR: [{ name: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }] },
      });
    case "project":
      return prisma.project.findMany({
        where: { ...filter, name: { contains: term, mode: "insensitive" } },
      });
    case "order":
      return prisma.order.findMany({
        where: { ...filter, description: { contains: term, mode: "insensitive" } },
      });
    case "invoice":
      return prisma.invoice.findMany({
        where: { ...filter, number: { contains: term, mode: "insensitive" } },
      });
    case "payment":
      return prisma.payment.findMany({
        where: { ...filter, providerRef: { contains: term, mode: "insensitive" } },
      });
    case "file":
      return prisma.fileObject.findMany({
        where: { ...filter, originalName: { contains: term, mode: "insensitive" } },
      });
    case "client":
      return prisma.client.findMany({
        where: { ...filter, companyName: { contains: term, mode: "insensitive" } },
      });
    case "ai_execution":
      return prisma.activityEvent.findMany({
        where: { type: "AI_EXECUTION", summary: { contains: term, mode: "insensitive" } },
      });
    default:
      return [];
  }
}
