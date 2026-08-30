import { PERMISSIONS } from "@/lib/permissions";
import type { AuthenticatedUser } from "@/lib/auth";

export type ScopeContext = {
  user: AuthenticatedUser;
  resourceClientId?: string | null;
  resourceProjectId?: string | null;
  resourceUserId?: string | null;
};

export function isClientUser(user: AuthenticatedUser): boolean {
  return Boolean(user.clientId) && !Boolean(user.teamMemberId);
}

export function isStaffUser(user: AuthenticatedUser): boolean {
  return Boolean(user.teamMemberId) || user.roleSlug === "super_admin";
}

export function ensureClientScope(context: ScopeContext): boolean {
  const { user, resourceClientId } = context;
  if (!resourceClientId) return true;
  if (user.clientId && user.clientId === resourceClientId) return true;
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) return true;
  return false;
}

export function ensureProjectScope(context: ScopeContext): boolean {
  const { user, resourceProjectId } = context;
  if (!resourceProjectId) return true;
  if (user.permissions.includes(PERMISSIONS.PROJECT_READ)) return true;
  if (user.permissions.includes(PERMISSIONS.PROJECT_READ_OWN) && user.clientId) return true;
  return false;
}

export function buildClientOwnedFilter(user: AuthenticatedUser) {
  if (isClientUser(user)) {
    return { clientId: user.clientId! };
  }
  return {};
}

export function buildAuthorizedProjectFilter(user: AuthenticatedUser) {
  if (isClientUser(user)) {
    return { clientId: user.clientId! };
  }
  if (user.permissions.includes(PERMISSIONS.PROJECT_READ)) {
    return {};
  }
  return {
    members: { some: { userId: user.id } },
  };
}

export function denyIfClientMismatch(user: AuthenticatedUser, clientId?: string | null): void {
  if (clientId && isClientUser(user) && user.clientId !== clientId) {
    throw new Error("Client access denied");
  }
}
