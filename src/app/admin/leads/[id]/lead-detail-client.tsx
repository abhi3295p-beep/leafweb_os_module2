"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  contactLeadAction,
  qualifyLeadAction,
  assignLeadAction,
  scheduleFollowUpAction,
  changeLeadStatusAction,
} from "@/lib/lead-actions";

type LeadGenerator = {
  id: string;
  name: string;
  email: string;
};

export default function LeadDetailClient({
  leadId,
  leadStatus,
  leadQualification,
  canQualify,
  canAssign,
  leadGenerators,
  isLeadGenerator,
}: {
  leadId: string;
  leadStatus: string;
  leadQualification: string;
  canQualify: boolean;
  canAssign: boolean;
  leadGenerators: LeadGenerator[];
  isLeadGenerator: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showQualify, setShowQualify] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  async function handleContact() {
    setError(null);
    startTransition(async () => {
      const result = await contactLeadAction(leadId);
      if (result.success) {
        router.refresh();
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleQualify(score: number) {
    setError(null);
    startTransition(async () => {
      const result = await qualifyLeadAction(leadId, score);
      if (result.success) {
        router.refresh();
        setShowQualify(false);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleAssign(assignedToId: string) {
    setError(null);
    startTransition(async () => {
      const result = await assignLeadAction(leadId, assignedToId);
      if (result.success) {
        router.refresh();
        setShowAssign(false);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const date = String(formData.get("nextFollowUpAt") || "");

    startTransition(async () => {
      const result = await scheduleFollowUpAction(leadId, date);
      if (result.success) {
        router.refresh();
        setShowFollowUp(false);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleStatusChange(status: string) {
    setError(null);
    startTransition(async () => {
      const result = await changeLeadStatusAction(leadId, status);
      if (result.success) {
        router.refresh();
        setShowStatus(false);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-rose-500/40 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-200">{error}</p>
        </Card>
      )}

      {/* Contact Button */}
      {leadStatus !== "WON" && leadStatus !== "LOST" && (
        <button
          onClick={handleContact}
          disabled={isPending}
          className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold/80 disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Mark as Contacted"}
        </button>
      )}

      {/* Qualify Button */}
      {canQualify && (
        <div>
          <button
            onClick={() => setShowQualify(!showQualify)}
            disabled={isPending}
            className="w-full rounded-lg bg-leaf px-4 py-2 text-sm font-medium text-ink hover:bg-leaf-strong disabled:opacity-50"
          >
            {isPending ? "..." : "Qualify Lead"}
          </button>
          {showQualify && (
            <div className="mt-2 space-y-2 rounded-lg border border-line bg-ink/50 p-3">
              <p className="text-xs text-mist">Select qualification score:</p>
              <div className="grid gap-2">
                {[
                  { label: "High (90%)", value: 90 },
                  { label: "Medium (60%)", value: 60 },
                  { label: "Low (30%)", value: 30 },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleQualify(option.value)}
                    disabled={isPending}
                    className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-foam hover:bg-ink/80 disabled:opacity-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Button */}
      {canAssign && (
        <div>
          <button
            onClick={() => setShowAssign(!showAssign)}
            disabled={isPending}
            className="w-full rounded-lg border border-line px-4 py-2 text-sm font-medium text-foam hover:bg-ink/20 disabled:opacity-50"
          >
            {isPending ? "..." : "Assign Lead"}
          </button>
          {showAssign && (
            <div className="mt-2 space-y-2 rounded-lg border border-line bg-ink/50 p-3">
              <p className="text-xs text-mist">Assign to:</p>
              <select
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
                disabled={isPending}
                defaultValue=""
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-foam disabled:opacity-50"
              >
                <option value="">Select Lead Generator...</option>
                {leadGenerators.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Schedule Follow-up */}
      <div>
        <button
          onClick={() => setShowFollowUp(!showFollowUp)}
          disabled={isPending}
          className="w-full rounded-lg border border-line px-4 py-2 text-sm font-medium text-foam hover:bg-ink/20 disabled:opacity-50"
        >
          {isPending ? "..." : "Schedule Follow-up"}
        </button>
        {showFollowUp && (
          <form onSubmit={handleFollowUp} className="mt-2 space-y-2 rounded-lg border border-line bg-ink/50 p-3">
            <input
              type="date"
              name="nextFollowUpAt"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-foam disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-leaf px-3 py-2 text-xs font-medium text-ink hover:bg-leaf-strong disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Schedule"}
            </button>
          </form>
        )}
      </div>

      {/* Status Change */}
      <div>
        <button
          onClick={() => setShowStatus(!showStatus)}
          disabled={isPending}
          className="w-full rounded-lg border border-line px-4 py-2 text-sm font-medium text-foam hover:bg-ink/20 disabled:opacity-50"
        >
          {isPending ? "..." : "Change Status"}
        </button>
        {showStatus && (
          <div className="mt-2 space-y-2 rounded-lg border border-line bg-ink/50 p-3">
            <p className="text-xs text-mist">Change to:</p>
            <select
              onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
              disabled={isPending}
              defaultValue=""
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-foam disabled:opacity-50"
            >
              <option value="">Select status...</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="MEETING_BOOKED">Meeting Booked</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
