import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function PortalPage() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-20">
          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Authentication required</p>
            <h1 className="mt-4 font-display text-4xl text-foam">Sign in to continue</h1>
            <p className="mt-3 text-mist">This client portal requires an authenticated session.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!(await canUserAccess(user, PERMISSIONS.PORTAL_ACCESS))) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-20">
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Access denied</p>
            <h1 className="mt-4 font-display text-4xl text-foam">Portal access required</h1>
            <p className="mt-3 text-mist">This session is not authorized for the client workspace.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Client portal</p>
            <h1 className="mt-3 font-display text-5xl text-foam">Your workspace</h1>
          </div>
          <div className="rounded-full border border-line px-4 py-2 text-sm text-mist">
            {user.email}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-line bg-panel p-6">
            <p className="text-sm text-mist">Projects</p>
            <p className="mt-4 text-3xl font-display text-foam">3</p>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-6">
            <p className="text-sm text-mist">Invoices</p>
            <p className="mt-4 text-3xl font-display text-foam">2</p>
          </div>
          <div className="rounded-3xl border border-line bg-panel p-6">
            <p className="text-sm text-mist">Tasks</p>
            <p className="mt-4 text-3xl font-display text-foam">5</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
