import { prisma } from "../../db";

import { PERMISSIONS, AuthorizationError } from "@/lib/permissions";
import type { AuthenticatedUser } from "@/lib/auth";

export function requireDatabase(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database verification blocked: DATABASE_URL is not configured");
  }
}

export function ensureClientAccess(user: AuthenticatedUser, clientId?: string | null): void {
  if (!clientId) return;
  if (user.clientId && user.clientId === clientId) return;
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) return;
  throw new AuthorizationError("Client access denied");
}

export function ensurePermission(user: AuthenticatedUser, permission: string): void {
  if (user.permissions.includes(permission as never) || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return;
  }
  throw new AuthorizationError(`Missing permission: ${permission}`);
}

export function buildClientScopedWhere(user: AuthenticatedUser, overrideClientId?: string | null) {
  const clientId = overrideClientId ?? user.clientId;
  if (!user.clientId || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return {};
  }
  return { clientId };
}

export function buildSearchScope(user: AuthenticatedUser) {
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return {};
  }

  if (user.clientId) {
    return { clientId: user.clientId };
  }

  return { OR: [{ clientId: { not: null } }, { clientId: null }] };
}

export async function withDatabase<T>(runner: (client: typeof prisma) => Promise<T>): Promise<T> {
  requireDatabase();
  return runner(prisma);
}
