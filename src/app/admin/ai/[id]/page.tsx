import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "../../../../../db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AIEmployeePage({ params }: Props) {
  const user = await requireAuthenticatedUser();

  if (!user || !(await canUserAccess(user, PERMISSIONS.AI_READ))) {
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

  const { id } = await params;

  const employee = await prisma.aIEmployee.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!employee) {
    notFound();
  }

  const capabilities = Array.isArray(employee.capabilities)
    ? employee.capabilities.filter(
        (cap): cap is string => typeof cap === "string",
      )
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <Link
        href="/admin/ai"
        className="text-sm text-leaf hover:underline"
      >
        ← Back to AI Employees
      </Link>

      <div className="mt-8">
        <p className="text-sm uppercase tracking-[0.22em] text-leaf">
          {employee.type}
        </p>

        <h1 className="mt-2 font-display text-4xl text-foam">
          {employee.displayName || employee.name}
        </h1>

        <p className="mt-3 max-w-3xl text-mist">
          {employee.description}
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">Status</p>
          <p className="mt-2 font-semibold text-leaf">{employee.status}</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">Tasks</p>
          <p className="mt-2 font-display text-3xl text-foam">
            {employee.tasks.length}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6">
          <p className="text-sm text-mist">Capabilities</p>
          <p className="mt-2 font-display text-3xl text-foam">
            {capabilities.length}
          </p>
        </div>
      </div>

      {capabilities.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl text-foam">
            Capabilities
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-full bg-leaf/10 px-3 py-1 text-sm text-leaf"
              >
                {capability}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-foam">
          Recent Tasks
        </h2>

        {employee.tasks.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-line bg-panel p-8 text-mist">
            No tasks assigned yet.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {employee.tasks.map((task) => (
              <Card key={task.id}>
                <CardTitle>{task.result || "AI Task"}</CardTitle>
                <CardDescription>
                  <span className="block">{task.status}</span>
                  <span className="mt-1 block text-xs">{task.error || "No task details available."}</span>
                </CardDescription>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
