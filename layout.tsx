import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

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
  title: "LEAFWEB — Build Smarter. Automate Faster. Grow Bigger.",
  description:
    "Building premium websites, AI automations and digital solutions.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
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
