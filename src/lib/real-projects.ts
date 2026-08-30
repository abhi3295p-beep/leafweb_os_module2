import { prisma } from "../../db";

import type { AuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ensureClientAccess, ensurePermission, requireDatabase } from "@/lib/db-guard";

export async function listProjectsForUser(user: AuthenticatedUser) {
  requireDatabase();

  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }

  if (user.clientId) {
    return prisma.project.findMany({
      where: { clientId: user.clientId },
      orderBy: { createdAt: "desc" },
    });
  }

  ensurePermission(user, PERMISSIONS.PROJECT_READ);
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createProjectRecord(
  user: AuthenticatedUser,
  input: {
    name: string;
    description: string;
    clientId: string;
    budget?: number | null;
    startDate?: string | null;
    dueDate?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.PROJECT_WRITE);
  ensureClientAccess(user, input.clientId);

  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      clientId: input.clientId,
      budget: input.budget ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: "NEW",
      progress: 0,
    },
  });
}

export async function updateProjectRecord(
  user: AuthenticatedUser,
  projectId: string,
  input: {
    name?: string;
    description?: string;
    status?: "NEW" | "REQUIREMENTS" | "PLANNING" | "DESIGN" | "DEVELOPMENT" | "TESTING" | "CLIENT_REVIEW" | "REVISIONS" | "DEPLOYMENT" | "COMPLETED";
    progress?: number;
    dueDate?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.PROJECT_WRITE);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  ensureClientAccess(user, project.clientId);

  if (typeof input.progress === "number" && (input.progress < 0 || input.progress > 100)) {
    throw new Error("Progress must be between 0 and 100");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      name: input.name ?? project.name,
      description: input.description ?? project.description,
      status: input.status ?? project.status,
      progress: input.progress ?? project.progress,
      dueDate: input.dueDate ? new Date(input.dueDate) : project.dueDate,
    },
  });
}

export async function createProjectMilestoneRecord(
  user: AuthenticatedUser,
  input: {
    projectId: string;
    name: string;
    description?: string | null;
    dueDate?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.PROJECT_WRITE);

  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error("Project not found");
  ensureClientAccess(user, project.clientId);

  return prisma.milestone.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: "PENDING",
      progress: 0,
    },
  });
}

export async function createProjectTaskRecord(
  user: AuthenticatedUser,
  input: {
    projectId: string;
    title: string;
    description?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.TASK_WRITE);

  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error("Project not found");
  ensureClientAccess(user, project.clientId);

  return prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: "TODO",
    },
  });
}

export async function assignProjectMember(user: AuthenticatedUser, projectId: string, userId: string) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.PROJECT_WRITE);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  ensureClientAccess(user, project.clientId);

  return prisma.projectMember.create({
    data: {
      projectId,
      userId,
    },
  });
}
