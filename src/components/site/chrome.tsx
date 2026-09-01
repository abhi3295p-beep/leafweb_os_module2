import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full border border-line/80 bg-ink",
        compact ? "h-8 w-8" : "h-10 w-10",
      ].join(" ")}
    >
      <Image
        src="/branding/leafweb-logo.png"
        alt="LeafWeb"
        fill
        priority
        sizes={compact ? "32px" : "40px"}
        className="object-contain p-1"
      />
    </div>
  );
}

const nav = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-lg tracking-[0.18em] text-foam">LEAFWEB</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-mist md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foam">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-mist hover:text-foam sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-leaf px-4 py-2 text-sm font-medium text-ink hover:bg-leaf-strong"
          >
            Start Your Project
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <p className="font-display tracking-[0.2em] text-foam">LEAFWEB</p>
          </div>
          <p className="mt-3 max-w-xs text-sm text-mist">
          {SITE_CONFIG.tagline}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foam">Studio</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
            <Link key="services" href="/services">Services</Link>
            <Link key="projects" href="/projects">Projects</Link>
            <Link key="pricing" href="/pricing">Pricing</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foam">Clients</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
            <Link key="login" href="/login">Client portal</Link>
            <Link key="contact" href="/contact">Start a project</Link>
            <Link key="faq" href="/faq">FAQ</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foam">Contact</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
            <a href={SITE_CONFIG.phoneHref} className="hover:text-foam">
              {SITE_CONFIG.phone}
            </a>
            <a href={SITE_CONFIG.emailHref} className="hover:text-foam">
              {SITE_CONFIG.email}
            </a>
            <a
              href={SITE_CONFIG.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foam"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
