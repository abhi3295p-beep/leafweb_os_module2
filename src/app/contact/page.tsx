import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { SITE_CONFIG } from "@/lib/site-config";

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16">
        <h1 className="font-display text-5xl text-foam">Let’s build your next digital system.</h1>
        <p className="mt-4 text-mist">Contact us to discuss your website, automation, or project workflow requirements.</p>
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8">
          <p className="text-sm font-medium text-foam">Call</p>
          <a href={SITE_CONFIG.phoneHref} className="mt-2 block text-sm text-mist hover:text-foam">
            {SITE_CONFIG.phone}
          </a>
          <p className="mt-5 text-sm font-medium text-foam">Email</p>
          <a href={SITE_CONFIG.emailHref} className="mt-2 block text-sm text-mist hover:text-foam">
            {SITE_CONFIG.email}
          </a>
          <p className="mt-5 text-sm font-medium text-foam">Instagram</p>
          <a
            href={SITE_CONFIG.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm text-mist hover:text-foam"
          >
            @leafweb_26
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
