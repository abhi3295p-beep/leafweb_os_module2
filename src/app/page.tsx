import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const services = [
  "Website Development",
  "Custom Web Applications",
  "AI Automation",
  "SEO & Growth",
  "Client Portals",
  "Operations OS",
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
              Build smarter. Automate faster. Grow bigger.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-mist">
              LEAFWEB OS turns the agency website, client portal, CRM, project system, billing, and AI workflows into one secure operating system.
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
          <p className="text-sm tracking-[0.2em] text-gold uppercase">Operating system</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardTitle>Client portal</CardTitle>
              <CardDescription>Clients view projects, orders, invoices, approvals, and milestones with session-scoped access only.</CardDescription>
            </Card>
            <Card>
              <CardTitle>CRM + admin</CardTitle>
              <CardDescription>Leads, clients, project status, team work, and operational workflows stay inside the protected admin OS.</CardDescription>
            </Card>
            <Card>
              <CardTitle>Billing + AI</CardTitle>
              <CardDescription>Orders, invoices, payments, and AI employee permissions enforce ownership and verification before execution.</CardDescription>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-foam">Core services</h2>
            <Link href="/services" className="text-sm text-leaf">
              All services
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service}>
                <CardTitle>{service}</CardTitle>
                <CardDescription>Built from the database-backed service catalog and project flow.</CardDescription>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
