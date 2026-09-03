"use client";

import { useState, useTransition } from "react";
import {
  approveAITask,
  rejectAITask,
} from "@/lib/ai-approvals";

type Approval = {
  id: string;
  status: string;
  requiredApprovers: unknown;
  createdAt: Date;
  task: {
    id: string;
    taskType: string;
    priority: number;
    status: string;
    input: unknown;
    result: unknown;
    error: string | null;
  };
  aiEmployee: {
    id: string;
    name: string;
    displayName: string | null;
    type: string;
  };
};

type ApprovalQueueProps = {
  approvals: Approval[];
};

export default function ApprovalQueue({
  approvals: initialApprovals,
}: ApprovalQueueProps) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(approvalId: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await approveAITask(approvalId);

      if (!response.success) {
        setMessage(
          `Approval failed: ${response.error ?? "Unknown error"}`,
        );
        return;
      }

      setApprovals((current) =>
        current.filter((approval) => approval.id !== approvalId),
      );

      setMessage(
        "Approved successfully. AI task execution has started.",
      );
    });
  }

  function handleReject(approvalId: string) {
    const reason = window.prompt(
      "Why are you rejecting this AI task?",
    );

    if (!reason?.trim()) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const response = await rejectAITask(
        approvalId,
        reason.trim(),
      );

      if (!response.success) {
        setMessage(
          `Rejection failed: ${response.error ?? "Unknown error"}`,
        );
        return;
      }

      setApprovals((current) =>
        current.filter((approval) => approval.id !== approvalId),
      );

      setMessage("AI task rejected successfully.");
    });
  }

  if (approvals.length === 0) {
    return (
      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-foam">
              Pending Approvals
            </h2>
            <p className="mt-1 text-sm text-mist">
              AI actions waiting for administrator approval.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-8 text-center">
          <p className="text-sm text-mist">
            No pending AI approvals.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-foam">
          Pending Approvals
        </h2>

        <p className="mt-1 text-sm text-mist">
          Review AI actions before they are executed.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-leaf/30 bg-leaf/10 p-4 text-sm text-leaf">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {approvals.map((approval) => {
          const employeeName =
            approval.aiEmployee.displayName ||
            approval.aiEmployee.name;

          return (
            <div
              key={approval.id}
              className="rounded-2xl border border-amber-500/30 bg-panel p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-400">
                      Approval Required
                    </span>

                    <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs text-leaf">
                      Priority {approval.task.priority}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-foam">
                    {approval.task.taskType}
                  </h3>

                  <p className="mt-2 text-sm text-mist">
                    Assigned to{" "}
                    <span className="text-leaf">
                      {employeeName}
                    </span>
                  </p>

                  <div className="mt-4 rounded-xl border border-line bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-mist/60">
                      Task ID
                    </p>

                    <p className="mt-1 break-all text-xs text-mist">
                      {approval.task.id}
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-mist/60">
                    Status: {approval.task.status}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleApprove(approval.id)
                    }
                    className="rounded-full border border-leaf bg-leaf px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending
                      ? "Processing..."
                      : "Approve & Execute"}
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleReject(approval.id)
                    }
                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-6 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
