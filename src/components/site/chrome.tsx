import Link from "next/link";

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
        <Link href="/" className="font-display text-lg tracking-[0.2em] text-foam">
          LEAFWEB
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
          <p className="font-display tracking-[0.2em] text-foam">LEAFWEB</p>
          <p className="mt-3 max-w-xs text-sm text-mist">
            Building premium websites, AI automations, and digital solutions.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foam">Studio</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
            <Link href="/services">Services</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foam">Clients</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
            <Link href="/login">Client portal</Link>
            <Link href="/contact">Start a project</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foam">Contact</p>
          <p className="mt-3 text-sm text-mist">hello@leafweb.local</p>
        </div>
      </div>
    </footer>
  );
}
