import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_CONFIG } from "@/lib/site-config";
import "./globals.css";

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LEAFWEB — Premium Websites, AI Automations & Digital Solutions",
  description:
    "LeafWeb builds premium websites, AI automations, custom digital solutions, client portals, and business operating systems.",
  openGraph: {
    title: "LEAFWEB — Premium Websites, AI Automations & Digital Solutions",
    description:
      "LeafWeb builds premium websites, AI automations, custom digital solutions, client portals, and business operating systems.",
    siteName: SITE_CONFIG.brand,
    type: "website",
  },
  icons: {
    icon: "/branding/leafweb-logo.png",
    shortcut: "/branding/leafweb-logo.png",
    apple: "/branding/leafweb-logo.png",
  },
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-foam">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
