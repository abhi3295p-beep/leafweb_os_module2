import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS, ROLE_SLUGS } from "@/lib/permissions";
import { prisma } from "../../../../db";

export default async function LeadsPage() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200">
            Authentication required
          </p>
          <h1 className="mt-4 font-display text-4xl text-foam">
            Sign in to continue
          </h1>
        </div>
      </main>
    );
  }

  if (!(await canUserAccess(user, PERMISSIONS.LEAD_READ))) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200">
            Access denied
          </p>
          <h1 className="mt-4 font-display text-4xl text-foam">
            Lead access required
          </h1>
        </div>
      </main>
    );
  }

  const isLeadGenerator =
    user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR;

  const where: {
    clientId?: string;
  } = {};

  if (user.clientId) {
    where.clientId = user.clientId;
  }

  const [leads, newLeadsCount, qualifiedLeadsCount, totalLeads] =
    await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          name: true,
          status: true,
          company: true,
          email: true,
          phone: true,
          message: true,
          createdAt: true,
        },
      }),

      prisma.lead.count({
        where: {
          ...where,
          status: "NEW",
        },
      }),

      prisma.lead.count({
        where: {
          ...where,
          status: "QUALIFIED",
        },
      }),

      prisma.lead.count({
        where,
      }),
    ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-4xl text-foam">
            {isLeadGenerator ? "My Leads" : "Lead Management"}
          </h1>

          <p className="mt-2 text-mist">
            {isLeadGenerator
              ? `You have ${totalLeads} leads`
              : `Manage ${totalLeads} leads in the pipeline`}
          </p>
        </div>

        {(await canUserAccess(user, PERMISSIONS.LEAD_WRITE)) && (
          <Link
            href="/admin/leads/new"
            className="rounded-full bg-leaf px-6 py-2 text-sm font-medium text-ink hover:bg-leaf-strong"
          >
            + New Lead
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Total Leads
          </div>

          <div className="mt-2 text-3xl font-bold text-leaf">
            {totalLeads}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            New Leads
          </div>

          <div className="mt-2 text-3xl font-bold text-gold">
            {newLeadsCount}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Qualified
          </div>

          <div className="mt-2 text-3xl font-bold text-green-400">
            {qualifiedLeadsCount}
          </div>
        </Card>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8 text-center">
          <p className="text-mist">
            {isLeadGenerator
              ? "No leads assigned to you yet."
              : "No leads in this view."}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-line/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-mist">
                  Lead Name
                </th>

                <th className="px-4 py-3 text-left font-medium text-mist">
                  Company
                </th>

                <th className="px-4 py-3 text-left font-medium text-mist">
                  Email
                </th>

                <th className="px-4 py-3 text-left font-medium text-mist">
                  Status
                </th>

                <th className="px-4 py-3 text-left font-medium text-mist">
                  Created
                </th>

                <th className="px-4 py-3 text-left font-medium text-mist">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-line/30 hover:bg-ink/40"
                >
                  <td className="px-4 py-3 text-foam">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-mist">
                    {lead.company || "—"}
                  </td>

                  <td className="px-4 py-3 text-mist text-xs">
                    {lead.email}
                  </td>

                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        lead.status === "QUALIFIED"
                          ? "leaf"
                          : "mist"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-mist text-xs">
                    {lead.createdAt.toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-leaf hover:text-leaf-strong text-xs font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}