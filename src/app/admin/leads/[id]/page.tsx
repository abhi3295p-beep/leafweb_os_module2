import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS, ROLE_SLUGS } from "@/lib/permissions";
import { prisma } from "../../../../../db";
import LeadDetailClient from "./lead-detail-client";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!lead) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <Link
          href="/admin/leads"
          className="text-sm text-leaf hover:text-leaf-strong"
        >
          ← Back to Leads
        </Link>

        <div className="mt-8 rounded-3xl border border-line bg-panel p-8 text-center">
          <p className="text-mist">Lead not found</p>
        </div>
      </main>
    );
  }

  if (
    user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR &&
    lead.assignedToId !== user.id
  ) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200">
            Access denied
          </p>
          <h1 className="mt-4 font-display text-4xl text-foam">
            You don't have access to this lead
          </h1>
        </div>
      </main>
    );
  }

  const isLeadGenerator = user.roleSlug === ROLE_SLUGS.LEAD_GENERATOR;
  const canQualify = await canUserAccess(user, PERMISSIONS.LEAD_QUALIFY);
  const canAssign = await canUserAccess(user, PERMISSIONS.LEAD_ASSIGN);
  const canWrite = await canUserAccess(user, PERMISSIONS.LEAD_WRITE);

  const [assignedTo, leadGenerators] = await Promise.all([
    lead.assignedToId
      ? prisma.user.findUnique({
          where: { id: lead.assignedToId },
          select: { id: true, name: true, email: true },
        })
      : null,
    canAssign
      ? prisma.user.findMany({
          where: {
            role: {
              slug: ROLE_SLUGS.LEAD_GENERATOR,
            },
            deletedAt: null,
          },
          select: { id: true, name: true, email: true },
        })
      : [],
  ]);

  const qualification = lead.qualification ?? "UNQUALIFIED";
  const qualificationScore = lead.qualificationScore ?? 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex items-baseline justify-between">
        <Link
          href="/admin/leads"
          className="text-sm text-leaf hover:text-leaf-strong"
        >
          ← Back to Leads
        </Link>

        <div className="flex gap-2">
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

          <Badge
            tone={
              qualification === "QUALIFIED"
                ? "leaf"
                : qualification === "DISQUALIFIED"
                  ? "rose"
                  : "mist"
            }
          >
            {qualification}
          </Badge>
        </div>
      </div>

      <h1 className="font-display text-4xl text-foam">{lead.name}</h1>
      <p className="mt-2 text-mist">{lead.company || "No company listed"}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card className="p-6">
            <h2 className="font-semibold text-foam">Contact Information</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-mist">Email</p>
                <p className="font-medium text-foam">{lead.email}</p>
              </div>

              {lead.phone && (
                <div>
                  <p className="text-mist">Phone</p>
                  <p className="font-medium text-foam">{lead.phone}</p>
                </div>
              )}

              {lead.website && (
                <div>
                  <p className="text-mist">Website</p>
                  <p className="font-medium text-foam">
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-leaf hover:text-leaf-strong"
                    >
                      {lead.website}
                    </a>
                  </p>
                </div>
              )}

              {lead.location && (
                <div>
                  <p className="text-mist">Location</p>
                  <p className="font-medium text-foam">{lead.location}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foam">Lead Details</h2>

            <div className="mt-4 space-y-3 text-sm">
              {lead.industry && (
                <div>
                  <p className="text-mist">Industry</p>
                  <p className="font-medium text-foam">{lead.industry}</p>
                </div>
              )}

              {lead.source && (
                <div>
                  <p className="text-mist">Source</p>
                  <p className="font-medium capitalize text-foam">
                    {lead.source}
                  </p>
                </div>
              )}

              <div>
                <p className="text-mist">Created</p>
                <p className="font-medium text-foam">
                  {lead.createdAt.toLocaleDateString()}
                </p>
              </div>

              {lead.lastContactedAt && (
                <div>
                  <p className="text-mist">Last Contacted</p>
                  <p className="font-medium text-foam">
                    {lead.lastContactedAt.toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-mist">Contact Attempts</p>
                <p className="font-medium text-foam">
                  {lead.contactAttempts}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foam">Original Message</h2>
            <p className="mt-4 text-mist">{lead.message}</p>
          </Card>

          {lead.notes && (
            <Card className="p-6">
              <h2 className="font-semibold text-foam">Notes</h2>
              <p className="mt-4 text-mist">{lead.notes}</p>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-semibold text-foam">Activity</h2>

            <div className="mt-4 space-y-4">
              {lead.activities.length === 0 ? (
                <p className="text-sm text-mist">No activity yet</p>
              ) : (
                lead.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-l-2 border-leaf/30 pl-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="font-medium capitalize text-foam">
                        {activity.type.replace(/_/g, " ")}
                      </p>

                      <p className="text-xs text-mist">
                        {activity.createdAt.toLocaleDateString()}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-mist">
                      {activity.summary}
                    </p>

                    {activity.details && (
                      <p className="mt-1 text-xs text-mist/70">
                        {activity.details}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-foam">Qualification</h2>

            <div className="mt-4 space-y-2">
              <div>
                <p className="text-xs text-mist">Score</p>
                <p className="text-2xl font-bold text-leaf">
                  {qualificationScore}%
                </p>
              </div>

              <div className="h-2 rounded-full bg-ink/50">
                <div
                  className="h-2 rounded-full bg-leaf transition-all"
                  style={{
                    width: `${Math.min(qualificationScore, 100)}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-foam">Assigned To</h2>

            <div className="mt-4">
              {assignedTo ? (
                <div className="text-sm">
                  <p className="font-medium text-leaf">{assignedTo.name}</p>
                  <p className="text-xs text-mist">{assignedTo.email}</p>
                </div>
              ) : (
                <p className="text-sm text-mist">Unassigned</p>
              )}
            </div>
          </Card>

          {lead.nextFollowUpAt && (
            <Card className="p-6">
              <h2 className="font-semibold text-foam">Next Follow-up</h2>
              <p className="mt-4 text-sm font-medium text-gold">
                {lead.nextFollowUpAt.toLocaleDateString()}
              </p>
            </Card>
          )}

          {canWrite && (
            <LeadDetailClient
              leadId={id}
              leadStatus={lead.status}
              leadQualification={qualification}
              canQualify={canQualify}
              canAssign={canAssign}
              leadGenerators={leadGenerators}
              isLeadGenerator={isLeadGenerator}
            />
          )}
        </div>
      </div>
    </main>
  );
}
