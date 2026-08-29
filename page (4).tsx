import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { EmptyState } from "@/components/ui/empty-state";

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
        <h1 className="font-display text-4xl text-foam">Pricing</h1>
        <p className="mt-3 text-mist">
          Packages and starting prices come from Service and Package rows.
        </p>
        <div className="mt-10">
          <EmptyState
            title="Pricing is database-backed"
            description="This page will not invent package prices. Seed data in Module 2 populates the catalog."
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
