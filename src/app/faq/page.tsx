import { SiteFooter, SiteHeader } from "@/components/site/chrome";

const faqs = [
  {
    q: "Can clients see another client’s projects?",
    a: "No. Portal access is scoped by session identity and ownership checks before any resource loads.",
  },
  {
    q: "Do you process live payments today?",
    a: "Not in the foundation phase. Payment providers are defined and verified server-side before a payment is marked successful.",
  },
  {
    q: "Where are private files stored?",
    a: "Private files are stored outside public paths and accessed through authenticated server routes only.",
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
