import { SiteFooter, SiteHeader } from "@/components/site/chrome";

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16">
        <h1 className="font-display text-5xl text-foam">Let’s build your next digital system.</h1>
        <p className="mt-4 text-mist">Contact us to discuss your website, automation, or project workflow requirements.</p>
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8">
          <p className="text-sm text-mist">hello@leafweb.local</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
