import { SiteFooter, SiteHeader } from "@/components/site/chrome";

const faqs = [
  {
    q: "Can clients see another client’s projects?",
    a: "No. Portal queries always include the authenticated client id from the session. Resource ids from the URL are never trusted alone.",
  },
  {
    q: "Do you process live payments today?",
    a: "Not in Phase 1. Stripe and Razorpay are defined as PaymentProvider interfaces so the rest of billing can land without secret keys.",
  },
  {
    q: "Where are private files stored?",
    a: "Never under /public/uploads. Downloads go through an authenticated route after permission and ownership checks.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="font-display text-4xl text-foam">FAQ</h1>
        <div className="mt-10 space-y-8">
          {faqs.map((item) => (
            <section key={item.q}>
              <h2 className="text-lg text-foam">{item.q}</h2>
              <p className="mt-2 text-sm text-mist">{item.a}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
