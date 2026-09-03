import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "../../../db";

export default async function AdminPage() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-20">
          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Authentication required</p>
            <h1 className="mt-4 font-display text-4xl text-foam">Sign in to continue</h1>
            <p className="mt-3 text-mist">This private admin workspace requires an authenticated session.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!(await canUserAccess(user, PERMISSIONS.ADMIN_ACCESS))) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-20">
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Access denied</p>
            <h1 className="mt-4 font-display text-4xl text-foam">Admin access required</h1>
            <p className="mt-3 text-mist">This account does not have the required permissions for the private admin workspace.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const [leadCount, projectCount, invoiceCount] = await Promise.all([
    prisma.lead.count(),
    prisma.project.count(),
    prisma.invoice.count({ where: { status: { not: "PAID" } } }),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Admin OS</p>
            <h1 className="mt-3 font-display text-5xl text-foam">Operations command center</h1>
          </div>
          <div className="rounded-full border border-line px-4 py-2 text-sm text-mist">
            {user.roleSlug}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-line bg-panel p-6">
            <p className="text-sm text-mist">Leads</p>
            <p className="mt-4 text-3xl font-display text-foam">{leadCount}</p>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-6">
            <p className="text-sm text-mist">Open projects</p>
            <p className="mt-4 text-3xl font-display text-foam">{projectCount}</p>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-6">
            <p className="text-sm text-mist">Invoices due</p>
            <p className="mt-4 text-3xl font-display text-foam">{invoiceCount}</p>
          </div>
          {user.permissions.includes(PERMISSIONS.TEAM_READ) && (
            <Link
              href="/admin/team"
              className="group rounded-3xl border border-leaf/40 bg-panel p-6 transition-colors hover:border-leaf hover:bg-leaf/10"
            >
              <p className="text-sm text-mist">Operations</p>
              <p className="mt-4 font-display text-2xl text-foam">Team Management</p>
              <p className="mt-2 text-sm text-mist group-hover:text-foam">
                Manage team members, roles, access, and account status.
              </p>
            </Link>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
