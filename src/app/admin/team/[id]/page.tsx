import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { auditEvent } from "@/lib/audit";
import { canUserAccess, hashPassword, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "../../../../../db";

const updateSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(255), roleId: z.string().uuid() });
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

async function requireUpdate() {
  const user = await requireAuthenticatedUser();
  if (!user || !(await canUserAccess(user, PERMISSIONS.TEAM_UPDATE))) redirect("/login?error=forbidden");
  return user;
}

async function requireRead() {
  const user = await requireAuthenticatedUser();
  if (!user || !(await canUserAccess(user, PERMISSIONS.TEAM_READ))) redirect("/login?error=forbidden");
  return user;
}

async function updateMember(formData: FormData) {
  "use server";
  const actor = await requireUpdate();
  const id = value(formData, "id");
  const parsed = updateSchema.safeParse({ name: value(formData, "name"), email: value(formData, "email").toLowerCase(), roleId: value(formData, "roleId") });
  if (!parsed.success) redirect(`/admin/team/${id}?error=invalid-input`);
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId }, select: { id: true, slug: true } });
  if (!target || !role) redirect(`/admin/team/${id}?error=not-found`);
  if (target.id === actor.id && role.slug !== "super_admin") redirect(`/admin/team/${id}?error=unsafe-change`);
  if (role.slug === "super_admin" && actor.roleSlug !== "super_admin" && !actor.permissions.includes(PERMISSIONS.TEAM_MANAGE_ROLES)) redirect(`/admin/team/${id}?error=role-not-allowed`);
  if (target.role.slug === "super_admin" || target.role.slug === "admin") {
    if (role.slug !== "super_admin" && role.slug !== "admin") {
      const activeAdmins = await prisma.user.count({ where: { deletedAt: null, role: { slug: { in: ["admin", "super_admin"] } } } });
      if (activeAdmins <= 1) redirect(`/admin/team/${id}?error=last-admin`);
    }
  }
  const emailOwner = await prisma.user.findFirst({ where: { email: parsed.data.email, NOT: { id } }, select: { id: true } });
  if (emailOwner) redirect(`/admin/team/${id}?error=email-exists`);
  await prisma.user.update({ where: { id }, data: { name: parsed.data.name, email: parsed.data.email, roleId: role.id } });
  await auditEvent("admin_change", actor, { resourceType: "team_member", resourceId: id, metadata: { operation: "updated" } });
  redirect(`/admin/team/${id}?success=updated`);
}

async function resetPassword(formData: FormData) {
  "use server";
  const actor = await requireUpdate();
  const id = value(formData, "id");
  const password = String(formData.get("password") ?? "");
  if (password.length < 12) redirect(`/admin/team/${id}?error=password-policy`);
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  await auditEvent("admin_change", actor, { resourceType: "team_member", resourceId: id, metadata: { operation: "password_reset" } });
  redirect(`/admin/team/${id}?success=password-reset`);
}

export default async function TeamMemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string; success?: string }> }) {
  await requireRead();
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const member = await prisma.user.findUnique({ where: { id }, include: { role: { include: { permissions: { include: { permission: true } } } }, auditLogs: { orderBy: { createdAt: "desc" }, take: 8, select: { id: true, action: true, createdAt: true, metadata: true } } } });
  if (!member || member.role.slug === "client") return <main className="mx-auto max-w-3xl px-4 py-20"><p className="text-rose-200">Team member not found.</p></main>;
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
  return <main className="mx-auto max-w-4xl px-4 py-12">
    <Link href="/admin/team" className="text-sm text-leaf">← Back to Team</Link>
    <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-gold">Team member</p><h1 className="mt-3 font-display text-5xl text-foam">{member.name}</h1><p className="mt-2 text-mist">{member.email}</p></div><span className={member.deletedAt ? "text-rose-300" : "text-leaf"}>{member.deletedAt ? "Inactive" : "Active"}</span></div>
    {query.error ? <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">The team operation could not be completed.</p> : null}
    {query.success ? <p className="mt-6 rounded-2xl border border-leaf/40 bg-leaf/10 p-4 text-sm text-leaf">Team member updated successfully.</p> : null}
    <Card className="mt-8"><CardTitle>Edit member</CardTitle><form action={updateMember} className="mt-5 grid gap-4 md:grid-cols-2"><input type="hidden" name="id" value={member.id} /><input name="name" defaultValue={member.name} required className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam" /><input name="email" defaultValue={member.email} required type="email" className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam" /><select name="roleId" defaultValue={member.roleId} className="h-11 rounded-xl border border-line bg-ink px-4 text-sm text-foam">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><Button type="submit">Save changes</Button></form></Card>
    <Card className="mt-6"><CardTitle>Permissions</CardTitle><CardDescription>Resolved from the assigned database role.</CardDescription><div className="mt-4 flex flex-wrap gap-2">{member.role.permissions.map(({ permission }) => <span key={permission.id} className="rounded-full border border-line px-3 py-1 text-xs text-mist">{permission.key}</span>)}</div></Card>
    <Card className="mt-6"><CardTitle>Reset password</CardTitle><CardDescription>Set a new temporary password. The existing password is never displayed or recovered.</CardDescription><form action={resetPassword} className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="id" value={member.id} /><input name="password" required minLength={12} type="password" placeholder="Temporary password (12+ characters)" className="h-11 flex-1 rounded-xl border border-line bg-ink px-4 text-sm text-foam" /><Button type="submit">Reset password</Button></form></Card>
    <Card className="mt-6"><CardTitle>Recent activity</CardTitle>{member.auditLogs.length === 0 ? <CardDescription>No recent activity recorded.</CardDescription> : <div className="mt-4 space-y-3">{member.auditLogs.map((event) => <div key={event.id} className="flex justify-between text-sm"><span className="text-mist">{event.action}</span><span className="text-mist">{event.createdAt.toLocaleString()}</span></div>)}</div>}</Card>
  </main>;
}
