import { describe, expect, it } from "vitest";

import { AuthorizationError, PERMISSIONS } from "@/lib/permissions";
import {
  authorizeAiAction,
  buildAuthorizedSearchFilter,
  convertLeadToClient,
  createInvoice,
  createLead,
  createOrder,
  createProject,
  createProjectMilestone,
  createProjectTask,
  generateInvoiceNumber,
  qualifyLead,
  updateProjectProgress,
} from "@/lib/workflows";

describe("business workflows", () => {
  it("qualifies a lead with lead-write permission", () => {
    const lead = createLead({
      name: "Acme",
      email: "hello@acme.com",
      message: "Need a website",
      company: "Acme",
    });

    const qualified = qualifyLead(lead, {
      userId: "user-1",
      roleSlug: "admin",
      permissions: [PERMISSIONS.LEAD_WRITE],
      clientId: null,
      teamMemberId: "member-1",
    });

    expect(qualified.status).toBe("QUALIFIED");
  });

  it("converts an eligible lead to a client-owned conversion record", () => {
    const lead = createLead({
      name: "Northwind",
      email: "north@northwind.com",
      message: "Need a portal",
      company: "Northwind",
    });

    const qualified = qualifyLead(lead, {
      userId: "user-1",
      roleSlug: "admin",
      permissions: [PERMISSIONS.LEAD_WRITE, PERMISSIONS.ORDER_CONVERT],
      clientId: "client-a",
      teamMemberId: "member-1",
    });

    const result = convertLeadToClient(qualified, {
      userId: "user-1",
      roleSlug: "admin",
      permissions: [PERMISSIONS.ORDER_CONVERT, PERMISSIONS.ADMIN_ACCESS],
      clientId: "client-a",
      teamMemberId: "member-1",
    }, "client-a");

    expect(result.status).toBe("WON");
    expect(result.clientId).toBe("client-a");
  });

  it("denies cross-client access for project creation", () => {
    expect(() =>
      createProject(
        {
          name: "Client B project",
          description: "Should fail",
          clientId: "client-b",
        },
        {
          userId: "user-2",
          roleSlug: "client",
          permissions: [PERMISSIONS.PORTAL_ACCESS],
          clientId: "client-a",
          teamMemberId: null,
        },
      ),
    ).toThrow(AuthorizationError);
  });

  it("creates an invoice with a positive total and generated number", () => {
    const invoice = createInvoice(
      {
        clientId: "client-a",
        orderId: "order-1",
        subtotal: 1200,
        tax: 120,
      },
      {
        userId: "user-1",
        roleSlug: "admin",
        permissions: [PERMISSIONS.INVOICE_WRITE],
        clientId: "client-a",
        teamMemberId: "member-1",
      },
    );

    expect(invoice.total).toBe(1320);
    expect(invoice.status).toBe("DRAFT");
    expect(invoice.number).toMatch(/^INV-CLIE-/i);
  });

  it("manages milestones and task assignments", () => {
    const milestone = createProjectMilestone(
      {
        projectId: "project-1",
        name: "Discovery",
        dueDate: "2026-09-01",
      },
      {
        userId: "user-1",
        roleSlug: "project_manager",
        permissions: [PERMISSIONS.PROJECT_WRITE],
        clientId: "client-a",
        teamMemberId: "member-1",
      },
    );

    const task = createProjectTask(
      {
        projectId: "project-1",
        title: "Homepage copy",
        assigneeId: "user-2",
        dueDate: "2026-09-02",
      },
      {
        userId: "user-1",
        roleSlug: "project_manager",
        permissions: [PERMISSIONS.TASK_WRITE],
        clientId: "client-a",
        teamMemberId: "member-1",
      },
    );

    expect(milestone.status).toBe("PENDING");
    expect(task.status).toBe("TODO");
    expect(task.assigneeId).toBe("user-2");
  });

  it("updates project progress without exceeding 100%", () => {
    const result = updateProjectProgress("project-1", 100, {
      userId: "user-1",
      roleSlug: "admin",
      permissions: [PERMISSIONS.PROJECT_WRITE],
      clientId: "client-a",
      teamMemberId: "member-1",
    });

    expect(result.progress).toBe(100);
    expect(result.status).toBe("COMPLETED");
    expect(generateInvoiceNumber("client-a", 42)).toMatch(/^INV-CLIE-/i);
  });

  it("blocks a payment workflow when the client does not own the order", () => {
    expect(() =>
      createOrder(
        {
          clientId: "client-b",
          serviceId: "service-1",
          amount: 500,
          description: "Unauthorized",
        },
        {
          userId: "user-2",
          roleSlug: "client",
          permissions: [PERMISSIONS.ORDER_CREATE],
          clientId: "client-a",
          teamMemberId: null,
        },
      ),
    ).toThrow(AuthorizationError);
  });

  it("enforces AI tool scope and search authorization", () => {
    const actor = {
      userId: "ai-1",
      roleSlug: "client",
      permissions: [PERMISSIONS.PROJECT_READ],
      clientId: "client-a",
      teamMemberId: null,
    };

    expect(
      authorizeAiAction({
        actor,
        employeeScope: "client",
        approvedTools: ["lead_search"],
        requestedTool: "lead_search",
        resourceClientId: "client-a",
      }),
    ).toBe(true);

    expect(
      authorizeAiAction({
        actor,
        employeeScope: "client",
        approvedTools: ["lead_search"],
        requestedTool: "lead_search",
        resourceClientId: "client-b",
      }),
    ).toBe(false);

    expect(buildAuthorizedSearchFilter("lead", actor)).toEqual({ clientId: "client-a" });
  });
});
