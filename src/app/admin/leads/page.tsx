import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS, ROLE_SLUGS } from "@/lib/permissions";
import { prisma } from "../../../../db";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; qualification?: string }>;
}) {
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

  const params = await searchParams;
  const isLeadGenerator = user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR;

  const where: any = {};

  if (user.clientId) {
    where.clientId = user.clientId;
  } else if (isLeadGenerator) {
    where.assignedToId = user.id;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.qualification) {
    where.qualification = params.qualification;
  }

  const [
    leads,
    totalCount,
    newCount,
    contactedCount,
    qualifiedCount,
    convertedCount,
    lostCount,
    followUpsDueCount,
  ] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { ...where, status: "NEW" } }),
    prisma.lead.count({ where: { ...where, status: "CONTACTED" } }),
    prisma.lead.count({ where: { ...where, qualification: "QUALIFIED" } }),
    prisma.lead.count({ where: { ...where, status: "WON" } }),
    prisma.lead.count({ where: { ...where, status: "LOST" } }),
    prisma.lead.count({
      where: {
        ...where,
        nextFollowUpAt: {
          lte: new Date(),
        },
      },
    }),
  ]);

  const assignedIds = [
    ...new Set(
      leads
        .map((lead) => lead.assignedToId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const assignedUsers =
    assignedIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: assignedIds },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const assignedUserMap = new Map(
    assignedUsers.map((assignedUser) => [
      assignedUser.id,
      assignedUser.name,
    ])
  );

  const conversionRate =
    totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-4xl text-foam">
            {isLeadGenerator ? "My Leads" : "Lead Management"}
          </h1>

          <p className="mt-2 text-mist">
            {isLeadGenerator
              ? `You have ${totalCount} leads in your pipeline`
              : `Managing ${totalCount} leads across all generators`}
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

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Total Leads
          </div>
          <div className="mt-2 text-3xl font-bold text-leaf">{totalCount}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            New
          </div>
          <div className="mt-2 text-3xl font-bold text-gold">{newCount}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Qualified
          </div>
          <div className="mt-2 text-3xl font-bold text-green-400">
            {qualifiedCount}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Won
          </div>
          <div className="mt-2 text-3xl font-bold text-leaf-strong">
            {convertedCount}
          </div>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Contacted
          </div>
          <div className="mt-2 text-2xl font-bold text-foam">
            {contactedCount}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Lost
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {lostCount}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Follow-ups Due
          </div>
          <div className="mt-2 text-2xl font-bold text-gold">
            {followUpsDueCount}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">
            Conversion Rate
          </div>
          <div className="mt-2 text-2xl font-bold text-leaf">
            {conversionRate}%
          </div>
        </Card>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/admin/leads"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !params.status && !params.qualification
              ? "bg-leaf text-ink"
              : "border border-line text-foam hover:bg-ink/20"
          }`}
        >
          All
        </Link>

        <Link
          href="/admin/leads?status=NEW"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            params.status === "NEW"
              ? "bg-gold text-ink"
              : "border border-line text-foam hover:bg-ink/20"
          }`}
        >
          New
        </Link>

        <Link
          href="/admin/leads?status=CONTACTED"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            params.status === "CONTACTED"
              ? "bg-foam text-ink"
              : "border border-line text-foam hover:bg-ink/20"
          }`}
        >
          Contacted
        </Link>

        <Link
          href="/admin/leads?qualification=QUALIFIED"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            params.qualification === "QUALIFIED"
              ? "bg-green-400 text-ink"
              : "border border-line text-foam hover:bg-ink/20"
          }`}
        >
          Qualified
        </Link>

        <Link
          href="/admin/leads?status=WON"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            params.status === "WON"
              ? "bg-leaf-strong text-ink"
              : "border border-line text-foam hover:bg-ink/20"
          }`}
        >
          Won
        </Link>

        <Link
          href="/admin/leads?status=LOST"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            params.status === "LOST"
              ? "bg-rose-400 text-ink"
              : "border border-line text-foam hover:bg-ink/20"
          }`}
        >
          Lost
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8 text-center">
          <p className="text-mist">
            {isLeadGenerator ? "No leads in this filter." : "No leads found."}
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
                  Qual.
                </th>
                <th className="px-4 py-3 text-left font-medium text-mist">
                  Score
                </th>
                <th className="px-4 py-3 text-left font-medium text-mist">
                  Assigned To
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
              {leads.map((lead) => {
                const qualification = lead.qualification ?? "UNQUALIFIED";
                const qualificationScore = lead.qualificationScore ?? 0;

                return (
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

                    <td className="px-4 py-3 text-xs text-mist">
                      {lead.company || "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-mist">
                      {lead.email}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          lead.status === "WON"
                            ? "leaf"
                            : lead.status === "LOST"
                              ? "rose"
                              : "mist"
                        }
                      >
                        {lead.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          qualification === "QUALIFIED"
                            ? "leaf"
                            : qualification === "DISQUALIFIED"
                              ? "rose"
                              : "mist"
                        }
                      >
                        {qualification.charAt(0)}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 font-medium text-foam">
                      {qualificationScore}%
                    </td>

                    <td className="px-4 py-3 text-xs text-mist">
                      {lead.assignedToId
                        ? assignedUserMap.get(lead.assignedToId) ||
                          "Unknown user"
                        : "Unassigned"}
                    </td>

                    <td className="px-4 py-3 text-xs text-mist">
                      {lead.createdAt.toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-xs font-medium text-leaf hover:text-leaf-strong"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
