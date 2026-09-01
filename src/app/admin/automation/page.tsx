import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "../../../../db";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AutomationPage() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Authentication required</p>
          <h1 className="mt-4 font-display text-4xl text-foam">Sign in to continue</h1>
        </div>
      </main>
    );
  }

  if (!(await canUserAccess(user, PERMISSIONS.ADMIN_ACCESS))) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Access denied</p>
          <h1 className="mt-4 font-display text-4xl text-foam">Admin access required</h1>
        </div>
      </main>
    );
  }

  const automationEvents = await prisma.activityEvent.findMany({
    where: { type: { in: ["AI_EXECUTION", "PAYMENT", "PROJECT_UPDATE"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, type: true, summary: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Automation</h1>
      {automationEvents.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8 text-mist">No automation events recorded.</div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {automationEvents.map((event) => (
            <Card key={event.id}>
              <CardTitle>{event.type}</CardTitle>
              <CardDescription>
                <span className="block text-leaf">{event.summary}</span>
                <span className="block text-mist">Retry + idempotency protections enabled</span>
              </CardDescription>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
