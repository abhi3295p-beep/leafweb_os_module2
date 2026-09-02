import { PERMISSIONS, AuthorizationError } from "@/lib/permissions";

export type AuthContext = {
  userId: string;
  roleSlug: string;
  permissions: readonly string[];
  clientId?: string | null;
  teamMemberId?: string | null;
};

export type WorkflowLead = {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  message: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "MEETING_BOOKED" | "PROPOSAL_SENT" | "WON" | "LOST";
  serviceId?: string | null;
  clientId?: string | null;
};

export function assertClientAccess(user: AuthContext, resourceClientId?: string | null): void {
  if (!resourceClientId) return;
  if (user.clientId && user.clientId === resourceClientId) return;
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) return;
  throw new AuthorizationError("Client access denied");
}

export function canAccessClient(user: AuthContext, resourceClientId?: string | null): boolean {
  try {
    assertClientAccess(user, resourceClientId);
    return true;
  } catch {
    return false;
  }
}

export function createLead(input: {
  id?: string;
  name: string;
  email: string;
  message: string;
  company?: string | null;
  serviceId?: string | null;
}): WorkflowLead {
  return {
    id: input.id ?? `lead-${Date.now()}`,
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    message: input.message,
    status: "NEW",
    serviceId: input.serviceId ?? null,
    clientId: null,
  };
}

export function qualifyLead(lead: WorkflowLead, actor: AuthContext): WorkflowLead {
  if (!actor.permissions.includes(PERMISSIONS.LEAD_WRITE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: lead.write");
  }

  return { ...lead, status: "QUALIFIED" };
}

export function convertLeadToClient(
  lead: WorkflowLead,
  actor: AuthContext,
  clientId: string,
): { leadId: string; clientId: string; convertedAt: string; status: "WON" } {
  assertClientAccess(actor, clientId);
  if (lead.status !== "QUALIFIED" && lead.status !== "PROPOSAL_SENT") {
    throw new AuthorizationError("Lead must be qualified before conversion");
  }

  if (!actor.permissions.includes(PERMISSIONS.ORDER_CONVERT) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: order.convert");
  }

  return {
    leadId: lead.id,
    clientId,
    convertedAt: new Date().toISOString(),
    status: "WON",
  };
}

export function createProject(input: {
  id?: string;
  name: string;
  description: string;
  clientId: string;
  budget?: number | null;
  dueDate?: string | null;
}, actor: AuthContext) {
  assertClientAccess(actor, input.clientId);
  if (!actor.permissions.includes(PERMISSIONS.PROJECT_WRITE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: project.write");
  }

  return {
    id: input.id ?? `project-${Date.now()}`,
    name: input.name,
    description: input.description,
    clientId: input.clientId,
    budget: input.budget ?? null,
    dueDate: input.dueDate ?? null,
    status: "NEW",
    progress: 0,
  };
}

export function createOrder(input: {
  id?: string;
  clientId: string;
  serviceId: string;
  packageId?: string | null;
  amount: number;
  description: string;
  status?: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED" | "CANCELLED";
}, actor: AuthContext) {
  assertClientAccess(actor, input.clientId);
  if (!actor.permissions.includes(PERMISSIONS.ORDER_CREATE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: order.create");
  }

  return {
    id: input.id ?? `order-${Date.now()}`,
    clientId: input.clientId,
    serviceId: input.serviceId,
    packageId: input.packageId ?? null,
    amount: input.amount,
    description: input.description,
    status: input.status ?? "SUBMITTED",
  };
}

export function generateInvoiceNumber(clientId: string, sequence: number): string {
  const clientCode = clientId.slice(0, 4).toUpperCase();
  return `INV-${clientCode}-${String(sequence).padStart(4, "0")}`;
}

export function createProjectMilestone(
  input: {
    projectId: string;
    name: string;
    dueDate?: string | null;
    description?: string | null;
  },
  actor: AuthContext,
) {
  if (!actor.permissions.includes(PERMISSIONS.PROJECT_WRITE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: project.write");
  }

  return {
    projectId: input.projectId,
    name: input.name,
    description: input.description ?? null,
    status: "PENDING",
    progress: 0,
    dueDate: input.dueDate ?? null,
  };
}

export function createProjectTask(
  input: {
    projectId: string;
    title: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    description?: string | null;
  },
  actor: AuthContext,
) {
  if (!actor.permissions.includes(PERMISSIONS.TASK_WRITE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: task.write");
  }

  return {
    projectId: input.projectId,
    title: input.title,
    assigneeId: input.assigneeId ?? null,
    dueDate: input.dueDate ?? null,
    description: input.description ?? null,
    status: "TODO",
  };
}

export function createInvoice(input: {
  id?: string;
  clientId: string;
  orderId: string;
  subtotal: number;
  tax?: number;
  dueAt?: string | null;
}, actor: AuthContext) {
  assertClientAccess(actor, input.clientId);
  if (!actor.permissions.includes(PERMISSIONS.INVOICE_WRITE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: invoice.write");
  }

  const subtotal = Number(input.subtotal);
  const tax = Number(input.tax ?? 0);

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    throw new Error("Invoice subtotal must be greater than zero");
  }

  return {
    id: input.id ?? `invoice-${Date.now()}`,
    clientId: input.clientId,
    orderId: input.orderId,
    subtotal,
    tax,
    total: subtotal + tax,
    status: "DRAFT",
    dueAt: input.dueAt ?? null,
    number: generateInvoiceNumber(input.clientId, Date.now() % 10000),
  };
}

export function updateProjectProgress(
  projectId: string,
  progress: number,
  actor: AuthContext,
) {
  if (!actor.permissions.includes(PERMISSIONS.PROJECT_WRITE) && !actor.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    throw new AuthorizationError("Missing permission: project.write");
  }

  if (progress < 0 || progress > 100) {
    throw new Error("Project progress must be between 0 and 100");
  }

  return {
    projectId,
    progress,
    status: progress >= 100 ? "COMPLETED" : "DEVELOPMENT",
  };
}

export function authorizeAiAction(input: {
  actor: AuthContext;
  employeeScope: "global" | "client" | "project";
  approvedTools: readonly string[];
  requestedTool: string;
  resourceClientId?: string | null;
  resourceProjectId?: string | null;
}) {
  const { actor, employeeScope, approvedTools, requestedTool, resourceClientId, resourceProjectId } = input;

  if (!approvedTools.includes(requestedTool)) {
    return false;
  }

  if (employeeScope === "global") return true;
  if (employeeScope === "client") {
    return canAccessClient(actor, resourceClientId);
  }
  if (employeeScope === "project") {
    if (!resourceProjectId) return false;
    return Boolean(actor.permissions.includes(PERMISSIONS.PROJECT_READ) || actor.permissions.includes(PERMISSIONS.PROJECT_READ_ASSIGNED));
  }

  return false;
}

export function buildAuthorizedSearchFilter(
  resource: "lead" | "client" | "project" | "task" | "order" | "invoice" | "payment" | "ai_execution",
  user: AuthContext,
): Record<string, unknown> | null {
  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return {};
  }

  if (user.clientId) {
    if (resource === "lead" || resource === "client" || resource === "project" || resource === "order" || resource === "invoice" || resource === "payment") {
      return { clientId: user.clientId };
    }
    return null;
  }

  return null;
}
