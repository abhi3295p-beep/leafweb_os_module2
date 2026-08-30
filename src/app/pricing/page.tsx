import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const pricing = [
  { name: "Starter", price: "₹45K", description: "Focused website for a lean marketing presence." },
  { name: "Business", price: "₹85K", description: "Stronger strategic build with richer content and integrations." },
  { name: "Custom", price: "Custom", description: "Tailored system work for growth-focused operations." },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16">
        <h1 className="font-display text-5xl text-foam">Pricing</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pricing.map((tier) => (
            <Card key={tier.name}>
              <CardTitle>{tier.name}</CardTitle>
              <p className="mt-4 font-display text-4xl text-foam">{tier.price}</p>
              <CardDescription>{tier.description}</CardDescription>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
