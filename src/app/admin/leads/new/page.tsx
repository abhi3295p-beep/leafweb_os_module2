"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createLeadAction } from "@/lib/lead-actions";

export default function NewLeadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const input = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim() || undefined,
      company: String(formData.get("company") || "").trim() || undefined,
      website: String(formData.get("website") || "").trim() || undefined,
      industry: String(formData.get("industry") || "").trim() || undefined,
      location: String(formData.get("location") || "").trim() || undefined,
      message: String(formData.get("message") || "").trim(),
      source: String(formData.get("source") || "").trim() || undefined,
    };

    startTransition(async () => {
      const result = await createLeadAction(input);

      if (result.success) {
        router.push(`/admin/leads/${result.leadId}`);
      } else {
        setError(result.error);
      }
    });
  }

  const errorMessages: Record<string, string> = {
    "missing-required-fields": "Please fill in all required fields.",
    "invalid-email": "Please enter a valid email address.",
    unauthorized: "You don't have permission to create leads.",
    "server-error": "Something went wrong. Please try again.",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <Link href="/admin/leads" className="text-sm text-leaf hover:text-leaf-strong">
          ← Back to Leads
        </Link>
        <h1 className="mt-4 font-display text-4xl text-foam">Create New Lead</h1>
        <p className="mt-2 text-mist">Add a new lead to your pipeline</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-line bg-panel p-8">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-200">{errorMessages[error] || error}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foam">Lead Name *</label>
          <input
            type="text"
            name="name"
            required
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="John Doe"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foam">Email Address *</label>
          <input
            type="email"
            name="email"
            required
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="john@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-foam">Phone Number</label>
          <input
            type="tel"
            name="phone"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-foam">Company Name</label>
          <input
            type="text"
            name="company"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="Company Name"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-foam">Website</label>
          <input
            type="url"
            name="website"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="https://example.com"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-foam">Industry/Niche</label>
          <input
            type="text"
            name="industry"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="e.g., Technology, Retail, Healthcare"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-foam">Location</label>
          <input
            type="text"
            name="location"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="City, State or Country"
          />
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-foam">Lead Source</label>
          <select
            name="source"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam disabled:opacity-50"
          >
            <option value="">Select source...</option>
            <option value="website">Website Form</option>
            <option value="referral">Referral</option>
            <option value="social">Social Media</option>
            <option value="email">Email Campaign</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-foam">Message / Note *</label>
          <textarea
            name="message"
            required
            disabled={isPending}
            rows={4}
            className="mt-2 w-full rounded-lg border border-line bg-ink/50 px-4 py-2 text-foam placeholder:text-mist disabled:opacity-50"
            placeholder="What would you like to know? Any specific requirements or questions?"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-leaf px-6 py-2 font-medium text-ink hover:bg-leaf-strong disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Lead"}
          </button>
          <Link
            href="/admin/leads"
            className="flex items-center justify-center rounded-lg border border-line px-6 py-2 text-foam hover:bg-ink/20"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
