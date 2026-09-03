import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { auditEvent } from "@/lib/audit";
import { canUserAccess, hashPassword, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "../../../../db";

const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(12),
  confirmPassword: z.string().min(12),
  roleId: z.string().uuid(),
});

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function requireTeamAccess(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const user = await requireAuthenticatedUser();
  if (!user || !(await canUserAccess(user, permission))) redirect("/login?error=forbidden");
  return user;
}

async function createTeamMember(formData: FormData) {
  "use server";
  const actor = await requireTeamAccess(PERMISSIONS.TEAM_CREATE);
  const parsed = memberSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    roleId: formValue(formData, "roleId"),
  });
  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) redirect("/admin/team?error=invalid-input");

  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId }, select: { id: true, slug: true } });
  if (!role || (role.slug === "super_admin" && actor.roleSlug !== "super_admin" && !actor.permissions.includes(PERMISSIONS.TEAM_MANAGE_ROLES))) {
    redirect("/admin/team?error=role-not-allowed");
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) redirect("/admin/team?error=email-exists");

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        roleId: role.id,
      },
      select: { id: true },
    });
    await tx.teamMember.create({ data: { userId: created.id } });
    return created;
  });
  await auditEvent("admin_change", actor, { resourceType: "team_member", resourceId: user.id, metadata: { operation: "created" } });
  redirect("/admin/team?success=created");
}

async function toggleTeamMember(formData: FormData) {
  "use server";
  const actor = await requireTeamAccess(PERMISSIONS.TEAM_UPDATE);
  const userId = formValue(formData, "userId");
  const target = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!target || target.id === actor.id && target.role.slug === "super_admin") redirect("/admin/team?error=unsafe-change");
  const nextActive = target?.deletedAt !== null;
  if (!target) redirect("/admin/team?error=not-found");
  if (!nextActive && (target.role.slug === "super_admin" || target.role.slug === "admin")) {
    const activeAdmins = await prisma.user.count({ where: { deletedAt: null, role: { slug: { in: ["admin", "super_admin"] } } } });
    if (activeAdmins <= 1) redirect("/admin/team?error=last-admin");
  }
  await prisma.user.update({ where: { id: target.id }, data: { deletedAt: nextActive ? null : new Date() } });
  await auditEvent("admin_change", actor, { resourceType: "team_member", resourceId: target.id, metadata: { operation: nextActive ? "activated" : "deactivated" } });
  redirect("/admin/team?success=updated");
}

export default async function TeamPage({ searchParams }: { searchParams?: Promise<{ q?: string; role?: string; status?: string; error?: string; success?: string }> }) {
  await requireTeamAccess(PERMISSIONS.TEAM_READ);
  const params = searchParams ? await searchParams : {};
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
  const q = params.q?.trim() ?? "";
  const members = await prisma.user.findMany({
    where: {
      role: { slug: { not: "client" } },
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
      ...(params.role ? { roleId: params.role } : {}),
      ...(params.status === "active" ? { deletedAt: null } : params.status === "inactive" ? { deletedAt: { not: null } } : {}),
    },
    include: { role: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  const [total, active, administrators, inactive] = await Promise.all([
    prisma.user.count({ where: { role: { slug: { not: "client" } } } }),
    prisma.user.count({ where: { role: { slug: { not: "client" } }, deletedAt: null } }),
    prisma.user.count({ where: { role: { slug: { in: ["admin", "super_admin"] } }, deletedAt: null } }),
    prisma.user.count({ where: { role: { slug: { not: "client" } }, deletedAt: { not: null } } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Admin OS</p>
          <h1 className="mt-3 font-display text-5xl text-foam">Team</h1>
          <p className="mt-3 text-mist">Manage your team, roles, access, and account status.</p>
        </div>
        <a href="#add-member" className="inline-flex h-11 items-center justify-center rounded-full bg-leaf px-5 text-sm font-medium text-ink hover:bg-leaf-strong">+ Add Team Member</a>
      </div>

      {params.error ? <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{params.error === "last-admin" ? "The last active administrator cannot be deactivated." : params.error === "email-exists" ? "That email is already in use." : "The team operation could not be completed."}</p> : null}
      {params.success ? <p className="mt-6 rounded-2xl border border-leaf/40 bg-leaf/10 p-4 text-sm text-leaf">Team operation completed successfully.</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Total team members", total], ["Active members", active], ["Inactive members", inactive], ["Administrators", administrators]].map(([label, value]) => <Card key={label as string}><p className="text-sm text-mist">{label}</p><p className="mt-3 font-display text-3xl text-foam">{value}</p></Card>)}
      </div>

      <Card className="mt-8">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_160px_auto]">
          <input name="q" defaultValue={q} placeholder="Search team by name or email" aria-label="Search team" className="h-11 rounded-full border border-line bg-ink px-4 text-sm text-foam outline-none" />
          <select name="role" defaultValue={params.role ?? ""} aria-label="Filter by role" className="h-11 rounded-full border border-line bg-ink px-4 text-sm text-foam"><option value="">All roles</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
          <select name="status" defaultValue={params.status ?? ""} aria-label="Filter by status" className="h-11 rounded-full border border-line bg-ink px-4 text-sm text-foam"><option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <Button type="submit" size="sm" variant="secondary">Filter</Button>
        </form>
      </Card>

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-mist"><tr><th className="pb-4">Member</th><th className="pb-4">Role</th><th className="pb-4">Status</th><th className="pb-4">Created</th><th className="pb-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {members.map((member) => <tr key={member.id}><td className="py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf/20 text-leaf">{member.name.slice(0, 1).toUpperCase()}</div><div><p className="text-foam">{member.name}</p><p className="text-xs text-mist">{member.email}</p></div></div></td><td className="py-4 text-mist">{member.role.name}</td><td className="py-4"><span className={member.deletedAt ? "text-rose-300" : "text-leaf"}>{member.deletedAt ? "Inactive" : "Active"}</span></td><td className="py-4 text-mist">{member.createdAt.toLocaleDateString()}</td><td className="py-4 text-right"><div className="flex justify-end gap-2"><Link href={`/admin/team/${member.id}`} className="rounded-full border border-line px-3 py-1.5 text-xs text-mist hover:text-foam">View / Edit</Link><form action={toggleTeamMember}><input type="hidden" name="userId" value={member.id} /><Button type="submit" size="sm" variant="secondary">{member.deletedAt ? "Activate" : "Deactivate"}</Button></form></div></td></tr>)}
          </tbody>
        </table>
        {members.length === 0 ? <p className="py-10 text-center text-mist">No team members found.</p> : null}
      </Card>

      <Card id="add-member" className="mt-8">
        <CardTitle>Add Team Member</CardTitle>
        <CardDescription>Create a secure account with a database-backed role.</CardDescription>
        <form action={createTeamMember} className="mt-6 grid gap-4 md:grid-cols-2">
          <input name="name" required minLength={2} placeholder="Full name" aria-label="Full name" className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam" />
          <input name="email" required type="email" placeholder="Email" aria-label="Email" className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam" />
          <select name="roleId" required aria-label="Role" className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam"><option value="">Select role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
          <input name="password" required minLength={12} type="password" placeholder="Temporary password (12+ characters)" aria-label="Temporary password" className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam" />
          <input name="confirmPassword" required minLength={12} type="password" placeholder="Confirm password" aria-label="Confirm password" className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam" />
          <Button type="submit">Create team member</Button>
        </form>
      </Card>
    </main>
  );
}
