import { NextRequest, NextResponse } from "next/server";

import { canUserAccess, getCurrentAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

export type ProtectedActionOptions = {
  requiredPermission?: PermissionKey;
  allowClientPortal?: boolean;
  allowAdminAccess?: boolean;
  clientScope?: boolean;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getCurrentAuthenticatedUser();

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=auth-required", request.url));
    }

    if (!(await canUserAccess(user, PERMISSIONS.ADMIN_ACCESS))) {
      return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
    }
  }

  if (pathname.startsWith("/portal")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=auth-required", request.url));
    }

    if (!(await canUserAccess(user, PERMISSIONS.PORTAL_ACCESS))) {
      return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export async function ensureProtectedAccess(
  options: ProtectedActionOptions = {},
): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentAuthenticatedUser>>> }> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const requiredPermission = options.requiredPermission;
  if (requiredPermission && !(await canUserAccess(user, requiredPermission))) {
    throw new Error(`Missing permission: ${requiredPermission}`);
  }

  const isPortalUser = Boolean(user.clientId) && !user.teamMemberId;
  const isAdminUser = Boolean(user.teamMemberId) || user.roleSlug === "super_admin";

  if (options.allowClientPortal && !isPortalUser) {
    throw new Error("Client portal access required");
  }

  if (options.allowAdminAccess && !isAdminUser) {
    throw new Error("Admin access required");
  }

  return { user };
}
