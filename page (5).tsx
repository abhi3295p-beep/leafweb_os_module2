import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { EmptyState } from "@/components/ui/empty-state";

export default function ServicesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-16">
        <h1 className="font-display text-4xl text-foam">Services</h1>
        <p className="mt-3 max-w-2xl text-mist">
          Service catalog, packages, and starting prices are stored in
          PostgreSQL. This page will query the Service model after the
          database is migrated and seeded.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No services loaded"
            description="Connect PostgreSQL and run the seed to publish Website Development, AI Automation, and the rest of the catalog."
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
