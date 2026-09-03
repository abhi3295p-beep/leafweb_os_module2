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
            {employee.tasks.map((task) => {
              const input =
                task.input &&
                typeof task.input === "object" &&
                !Array.isArray(task.input)
                  ? (task.input as Record<string, unknown>)
                  : null;

              const output =
                task.output &&
                typeof task.output === "object" &&
                !Array.isArray(task.output)
                  ? (task.output as Record<string, unknown>)
                  : null;

              const objective =
                typeof input?.objective === "string"
                  ? input.objective
                  : null;

              const decision =
                typeof input?.ceoDecision === "string"
                  ? input.ceoDecision
                  : null;

              const reasoning =
                typeof input?.reasoning === "string"
                  ? input.reasoning
                  : null;

              const outputText =
                typeof output?.text === "string"
                  ? output.text
                  : null;

              const result =
                typeof task.result === "string" &&
                task.result.trim()
                  ? task.result
                  : null;

              return (
                <Card key={task.id}>
                  <CardTitle>
                    {result ||
                      task.taskType
                        .replace(/[_-]+/g, " ")
                        .replace(/\b\w/g, (char: string) =>
                          char.toUpperCase(),
                        ) ||
                      "AI Task"}
                  </CardTitle>

                  <CardDescription>
                    <span className="block font-medium">
                      {task.status}
                    </span>

                    <div className="mt-3 space-y-2 text-sm">
                      {objective && (
                        <p>
                          <span className="font-medium text-foam">
                            Objective:
                          </span>{" "}
                          {objective}
                        </p>
                      )}

                      {decision && (
                        <p>
                          <span className="font-medium text-foam">
                            Decision:
                          </span>{" "}
                          {decision}
                        </p>
                      )}

                      {reasoning && (
                        <p>
                          <span className="font-medium text-foam">
                            Reasoning:
                          </span>{" "}
                          {reasoning}
                        </p>
                      )}

                      {outputText && (
                        <div>
                          <p className="font-medium text-foam">
                            AI Output:
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words">
                            {outputText}
                          </p>
                        </div>
                      )}

                      {task.error && (
                        <p className="text-rose-200">
                          <span className="font-medium">
                            Error:
                          </span>{" "}
                          {task.error}
                        </p>
                      )}

                      {!objective &&
                        !decision &&
                        !reasoning &&
                        !outputText &&
                        !result &&
                        !task.error && (
                          <p>No task details available.</p>
                        )}
                    </div>
                  </CardDescription>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}