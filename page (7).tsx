import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";

const services = [
  "Website Development",
  "Custom Web Applications",
  "SaaS Development",
  "AI Automation",
  "AI Agents",
  "SEO",
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(196,165,116,0.12),transparent_40%)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
            <Badge tone="gold">Digital studio OS</Badge>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] tracking-tight text-foam md:text-7xl">
              Build Smarter. Automate Faster. Grow Bigger.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-mist">
              Building premium websites, AI automations, and digital solutions
              for teams that need more than a brochure site.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full bg-leaf px-7 text-sm font-medium text-ink hover:bg-leaf-strong"
              >
                Start Your Project
              </Link>
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-full border border-line px-7 text-sm text-foam hover:border-leaf/50"
              >
                View Services
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm tracking-[0.2em] text-gold uppercase">
            Agency metrics
          </p>
          <div className="mt-6">
            <EmptyState
              title="Live metrics load from the database"
              description="AgencySetting values will appear here after PostgreSQL is connected and seed data is applied. This section is not hardcoded."
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="text-sm tracking-[0.2em] text-gold uppercase">About</p>
            <h2 className="mt-4 font-display text-4xl text-foam">
              A private operating system for a public studio.
            </h2>
          </div>
          <p className="text-mist">
            LEAFWEB OS is the agency website, client portal, CRM, order desk,
            and project system in one product. Clients see their work. Staff
            run the studio. Permissions, not hidden menus, decide who can
            touch which record.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-foam">Services</h2>
            <Link href="/services" className="text-sm text-leaf">
              All services
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service}>
                <CardTitle>{service}</CardTitle>
                <CardDescription>
                  Catalog entries will be served from the Service table in the
                  next module.
                </CardDescription>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
