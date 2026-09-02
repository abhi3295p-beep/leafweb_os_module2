import Image from "next/image";
import Link from "next/link";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full border border-line/80 bg-ink",
        compact ? "h-7 w-7" : "h-9 w-9",
      ].join(" ")}
    >
      <Image
        src="/branding/leafweb-logo.png"
        alt="LeafWeb"
        fill
        priority
        sizes={compact ? "28px" : "36px"}
        className="object-contain p-1"
      />
    </div>
  );
}

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/team", label: "Team Management", permission: PERMISSIONS.TEAM_READ },
  { href: "/admin/files", label: "Files" },
  { href: "/admin/ai", label: "AI" },
  { href: "/admin/automation", label: "Automation" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/search", label: "Search" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentAuthenticatedUser();
  const visibleNav = nav.filter(
    (item) => !item.permission || user?.permissions.includes(item.permission),
  );

  return (
    <div className="flex min-h-full flex-col bg-ink text-foam">
      <div className="border-b border-line bg-panel/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandMark compact />
            <span className="font-display text-lg tracking-[0.18em] text-foam">LEAFWEB OS</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-mist">
            {visibleNav.map((item) => (
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

