import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const services = [
  {
    name: "Web development",
    description: "Modern websites and application builds designed for performance and conversion.",
  },
  {
    name: "E-commerce",
    description: "Catalogue, checkout, order, and reporting flows for growth-focused commerce businesses.",
  },
  {
    name: "AI automation",
    description: "Operational automations for onboarding, lead response, follow-ups, and internal task routing.",
  },
];

export default function ServicesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16">
        <h1 className="font-display text-5xl text-foam">Services</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.name}>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
