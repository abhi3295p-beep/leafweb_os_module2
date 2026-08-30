import Link from "next/link";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/files", label: "Files" },
  { href: "/admin/ai", label: "AI" },
  { href: "/admin/automation", label: "Automation" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/search", label: "Search" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col bg-ink text-foam">
      <div className="border-b border-line bg-panel/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <p className="font-display text-lg tracking-[0.2em] text-foam">LEAFWEB OS</p>
          <nav className="hidden flex-wrap items-center gap-3 text-sm text-mist md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-line px-3 py-1.5 hover:border-leaf/50 hover:text-foam">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
