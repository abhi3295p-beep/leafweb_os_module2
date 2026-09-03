"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { loginServerAction } from "@/lib/auth-actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const errorMessage = searchParams.get("error");

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await loginServerAction(formData);
      
      if (result.success) {
        router.push(result.redirectTarget);
      } else {
        router.push(`/login?error=${result.error}`);
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="w-full rounded-3xl border border-line bg-panel p-8 shadow-2xl shadow-black/20"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-line/80 bg-ink">
          <Image
            src="/branding/leafweb-logo.png"
            alt="LeafWeb"
            width={48}
            height={48}
            className="object-contain p-2"
            priority
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">LeafWeb OS</p>
          <p className="mt-1 text-sm text-mist">Client portal</p>
        </div>
      </div>
      <h1 className="mt-6 font-display text-4xl text-foam">Sign in</h1>
      <p className="mt-2 text-sm text-mist">Access your workspace securely.</p>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {errorMessage === "db-unavailable" && "Database is unavailable in this environment."}
          {errorMessage === "invalid-credentials" && "Invalid email or password."}
          {errorMessage === "missing-fields" && "Email and password are required."}
          {errorMessage === "auth-required" && "Your session expired. Please sign in again."}
          {errorMessage === "server-error" && "An unexpected error occurred. Please try again."}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <label className="block text-sm text-mist">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isPending}
            className="mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-foam outline-none ring-0 placeholder:text-mist/60 disabled:opacity-50"
            placeholder="name@example.com"
          />
        </label>

        <label className="block text-sm text-mist">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={isPending}
            className="mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-foam outline-none ring-0 placeholder:text-mist/60 disabled:opacity-50"
            placeholder="••••••••"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-leaf px-6 text-sm font-medium text-ink transition hover:bg-leaf-strong disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-mist">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
