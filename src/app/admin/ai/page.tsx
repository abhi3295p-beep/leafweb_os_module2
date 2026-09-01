import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "../../../../db";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AiPage() {
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

  if (!(await canUserAccess(user, PERMISSIONS.ANALYTICS_READ))) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Access denied</p>
          <h1 className="mt-4 font-display text-4xl text-foam">AI access required</h1>
        </div>
      </main>
    );
  }

  const aiEvents = await prisma.activityEvent.findMany({
    where: { type: "AI_EXECUTION" },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, summary: true, createdAt: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">AI Employees</h1>
      {aiEvents.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8 text-mist">No AI executions recorded.</div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {aiEvents.map((event) => (
            <Card key={event.id}>
              <CardTitle>{event.summary}</CardTitle>
              <CardDescription>
                <span className="block text-leaf">AI execution</span>
                <span className="block text-mist">{new Date(event.createdAt).toLocaleString()}</span>
              </CardDescription>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
