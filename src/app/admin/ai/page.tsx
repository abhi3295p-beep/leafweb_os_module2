import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "../../../../db";
import CEOControl from "./CEOControl";
import ApprovalQueue from "./ApprovalQueue";

export default async function AIPage() {
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

  if (!(await canUserAccess(user, PERMISSIONS.AI_READ))) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200">
            Access denied
          </p>
          <h1 className="mt-4 font-display text-4xl text-foam">
            AI access required
          </h1>
        </div>
      </main>
    );
  }

  const aiEmployees = await prisma.aIEmployee.findMany({
    include: {
      tasks: {
        where: {
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
        },
        take: 5,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const [
    totalTasks,
    completedTasks,
    failedTasks,
    pendingApprovals,
    pendingApprovalRecords,
  ] = await Promise.all([
    prisma.aITask.count(),

    prisma.aITask.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.aITask.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.aIApproval.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.aIApproval.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        task: true,
        aiEmployee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const successRate =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12">
        <h1 className="font-display text-4xl text-foam">
          AI Employees
        </h1>

        <p className="mt-2 text-mist">
          Manage AI-powered automation and workflows
        </p>
      </div>

      <CEOControl />

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">
            Total AI Employees
          </p>

          <p className="mt-2 font-display text-3xl text-leaf">
            {aiEmployees.length}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">
            Active Tasks
          </p>

          <p className="mt-2 font-display text-3xl text-leaf">
            {aiEmployees.reduce(
              (acc, emp) => acc + emp.tasks.length,
              0,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">
            Pending Approvals
          </p>

          <p className="mt-2 font-display text-3xl text-amber-400">
            {pendingApprovals}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">
            Success Rate
          </p>

          <p className="mt-2 font-display text-3xl text-leaf">
            {successRate}%
          </p>
        </div>
      </div>

      {aiEmployees.length === 0 ? (
        <div className="rounded-3xl border border-line bg-panel p-12 text-center">
          <p className="text-mist">
            No AI employees configured yet.
          </p>

          <Link
            href="/admin/ai/new"
            className="mt-4 inline-block rounded-full border border-leaf bg-leaf/10 px-6 py-2 text-sm text-leaf hover:bg-leaf/20"
          >
            Create AI Employee
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {aiEmployees.map((employee) => {
            const capabilities = Array.isArray(
              employee.capabilities,
            )
              ? employee.capabilities.filter(
                  (cap): cap is string =>
                    typeof cap === "string",
                )
              : [];

            return (
              <Link
                key={employee.id}
                href={`/admin/ai/${employee.id}`}
              >
                <Card className="cursor-pointer transition-all hover:border-leaf hover:bg-panel/80">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="capitalize">
                        {employee.type === "lead_generator" &&
                          "🎯 "}

                        {employee.type === "sales" &&
                          "💼 "}

                        {employee.type === "project_manager" &&
                          "📋 "}

                        {employee.type === "ceo" &&
                          "👑 "}

                        {employee.displayName ||
                          employee.name}
                      </CardTitle>

                      <CardDescription>
                        <span className="block text-leaf">
                          {employee.type}
                        </span>

                        <span className="mt-1 block text-xs text-mist/60">
                          {employee.description}
                        </span>
                      </CardDescription>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          employee.status === "IDLE"
                            ? "border border-green-500/40 bg-green-500/10 text-green-400"
                            : employee.status ===
                                "RUNNING"
                              ? "border border-blue-500/40 bg-blue-500/10 text-blue-400"
                              : employee.status ===
                                  "ERROR"
                                ? "border border-rose-500/40 bg-rose-500/10 text-rose-400"
                                : "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {employee.status}
                      </div>

                      {employee.tasks.length > 0 && (
                        <div className="mt-3 text-sm text-mist">
                          {employee.tasks.length} active
                        </div>
                      )}
                    </div>
                  </div>

                  {capabilities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {capabilities
                        .slice(0, 3)
                        .map((cap) => (
                          <span
                            key={cap}
                            className="inline-block rounded-full bg-leaf/10 px-2.5 py-0.5 text-xs text-leaf"
                          >
                            {cap}
                          </span>
                        ))}

                      {capabilities.length > 3 && (
                        <span className="inline-block text-xs text-mist">
                          +{capabilities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <ApprovalQueue
        approvals={pendingApprovalRecords}
      />

      <div className="mt-12">
        <h2 className="font-display text-2xl text-foam">
          Task Summary
        </h2>

        <div className="mt-6 rounded-2xl border border-line bg-panel p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-4 text-sm">
              <span className="text-mist">
                Total
              </span>

              <span className="font-semibold text-foam">
                {totalTasks}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-line pb-4 text-sm">
              <span className="text-mist">
                Completed
              </span>

              <span className="font-semibold text-green-400">
                {completedTasks}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-line pb-4 text-sm">
              <span className="text-mist">
                Failed
              </span>

              <span className="font-semibold text-rose-400">
                {failedTasks}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-mist">
                Pending Approvals
              </span>

              <span className="font-semibold text-amber-400">
                {pendingApprovals}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

