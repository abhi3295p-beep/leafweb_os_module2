import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
        <h1 className="font-display text-4xl text-foam">Start Your Project</h1>
        <p className="mt-3 text-mist">
          Contact submissions will write Lead records once authentication and
          the database seed are in place. This form is not wired to a fake
          success state.
        </p>
        <form className="mt-8 space-y-4">
          <Input name="name" label="Name" required />
          <Input name="email" type="email" label="Email" required />
          <Input name="company" label="Company" />
          <label className="block space-y-2">
            <span className="text-sm text-mist">Project notes</span>
            <textarea
              name="message"
              required
              className="min-h-32 w-full rounded-xl border border-line bg-ink px-3 py-3 text-sm text-foam outline-none focus:border-leaf/60 focus:ring-2 focus:ring-leaf/20"
            />
          </label>
          <Button type="submit" disabled>
            Submit after database is ready
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
