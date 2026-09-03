import { prisma } from "../../../../db";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
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

  const resolvedParams = searchParams ? await searchParams : {};
  const query = (resolvedParams.q ?? "").trim();

  const [leads, projects, invoices] = query
    ? await Promise.all([
        prisma.lead.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5, select: { id: true, name: true, status: true } }),
        prisma.project.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5, select: { id: true, name: true, status: true } }),
        prisma.invoice.findMany({ where: { number: { contains: query, mode: "insensitive" } }, take: 5, select: { id: true, number: true, status: true } }),
      ])
    : [[], [], []];

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Search + Filtering</h1>
      <div className="mt-8 rounded-3xl border border-line bg-panel p-8">
        <form method="get">
          <label className="block text-sm text-mist">
            Search leads, clients, projects, orders, invoices and AI executions
            <input
              name="q"
              defaultValue={query}
              className="mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-foam"
              placeholder="Search..."
            />
          </label>
        </form>
      </div>

      {query && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-line bg-panel p-6">
            <h2 className="text-xl text-foam">Leads</h2>
            <ul className="mt-4 space-y-2 text-mist">
              {leads.length === 0 ? <li>No matching leads.</li> : leads.map((item) => <li key={item.id}>{item.name} — {item.status}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-6">
            <h2 className="text-xl text-foam">Projects</h2>
            <ul className="mt-4 space-y-2 text-mist">
              {projects.length === 0 ? <li>No matching projects.</li> : projects.map((item) => <li key={item.id}>{item.name} — {item.status}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-6">
            <h2 className="text-xl text-foam">Invoices</h2>
            <ul className="mt-4 space-y-2 text-mist">
              {invoices.length === 0 ? <li>No matching invoices.</li> : invoices.map((item) => <li key={item.id}>{item.number} — {item.status}</li>)}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
