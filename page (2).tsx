import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
        <h1 className="font-display text-4xl text-foam">Sign in</h1>
        <p className="mt-3 text-sm text-mist">
          Session-based authentication lands in Module 3. This screen is the
          public entry, not a working login.
        </p>
        <form className="mt-8 space-y-4">
          <Input name="email" type="email" label="Email" disabled />
          <Input name="password" type="password" label="Password" disabled />
          <Button type="submit" disabled>
            Authentication not enabled yet
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
