import { describe, expect, it } from "vitest";
import {
  assertPermission,
  AuthorizationError,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  PERMISSIONS,
  ROLE_SLUGS,
} from "@/lib/permissions";
import { assignedProjectWhere, ownedByClient } from "@/lib/authz/scope";

describe("permission checks", () => {
  it("does not grant admin access from the client role", () => {
    const client = DEFAULT_ROLE_PERMISSIONS[ROLE_SLUGS.CLIENT];
    expect(hasPermission(client, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
    expect(hasPermission(client, PERMISSIONS.PORTAL_ACCESS)).toBe(true);
  });

  it("does not grant finance access to developers", () => {
    const developer = DEFAULT_ROLE_PERMISSIONS[ROLE_SLUGS.DEVELOPER];
    expect(hasPermission(developer, PERMISSIONS.FINANCE_READ)).toBe(false);
    expect(hasPermission(developer, PERMISSIONS.INVOICE_READ)).toBe(false);
    expect(hasPermission(developer, PERMISSIONS.PROJECT_READ_ASSIGNED)).toBe(
      true,
    );
  });

  it("prevents unauthorized order conversion", () => {
    const client = DEFAULT_ROLE_PERMISSIONS[ROLE_SLUGS.CLIENT];
    expect(() =>
      assertPermission(client, PERMISSIONS.ORDER_CONVERT),
    ).toThrow(AuthorizationError);
  });
});

describe("client isolation helpers", () => {
  it("scopes project access to the authenticated client", () => {
    expect(ownedByClient("project-b", "client-a")).toEqual({
      id: "project-b",
      clientId: "client-a",
      deletedAt: null,
    });
  });

  it("scopes staff project access to assignment", () => {
    expect(assignedProjectWhere("project-1", "user-dev")).toEqual({
      id: "project-1",
      deletedAt: null,
      members: { some: { userId: "user-dev" } },
    });
  });
});
