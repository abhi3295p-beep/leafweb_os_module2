import { redirect } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "../../../db";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  if (!process.env.DATABASE_URL) {
    redirect("/login?error=db-unavailable");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || user.deletedAt) {
    redirect("/login?error=invalid-credentials");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect("/login?error=invalid-credentials");
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);
  redirect(user.role.slug === "client" ? "/portal" : "/admin");
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const errorMessage = searchParams?.error;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-16">
        <form
          action={loginAction}
          className="w-full rounded-3xl border border-line bg-panel p-8 shadow-2xl shadow-black/20"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-gold">LeafWeb OS</p>
          <h1 className="mt-4 font-display text-4xl text-foam">Client portal</h1>
          <p className="mt-2 text-sm text-mist">Sign in to access your workspace.</p>

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {errorMessage === "db-unavailable" && "Database is unavailable in this environment."}
              {errorMessage === "invalid-credentials" && "Invalid email or password."}
              {errorMessage === "missing-fields" && "Email and password are required."}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block text-sm text-mist">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-foam outline-none ring-0 placeholder:text-mist/60"
                placeholder="name@example.com"
              />
            </label>

            <label className="block text-sm text-mist">
              Password
              <input
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-foam outline-none ring-0 placeholder:text-mist/60"
                placeholder="••••••••"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-leaf px-6 text-sm font-medium text-ink transition hover:bg-leaf-strong"
          >
            Sign in
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
