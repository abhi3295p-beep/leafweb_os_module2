import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
        <h1 className="font-display text-4xl text-foam">Projects</h1>
        <p className="mt-3 text-mist">
          Featured work will be selected from real Project records, not a
          static gallery.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No published projects yet"
            description="Public case studies appear after projects exist in the database."
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
