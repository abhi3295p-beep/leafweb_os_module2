"use client";

import { useState, useTransition } from "react";
import { runAICEO } from "@/lib/ai-ceo";

export default function CEOControl() {
  const [objective, setObjective] = useState(
    "Increase qualified B2B opportunities for LEAFWEB this week.",
  );
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    plan?: {
      decision: string;
      priority: string;
      delegateTo: string;
      taskType: string;
      reasoning: string;
    };
    delegatedTo?: {
      name: string;
      type: string;
    };
    durationMs?: number;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleRun() {
    setResult(null);

    startTransition(async () => {
      const response = await runAICEO(objective);
      setResult(response);
    });
  }

  return (
    <section className="mb-10 rounded-3xl border border-leaf/30 bg-leaf/5 p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">
            Executive Orchestrator
          </p>

          <h2 className="mt-2 font-display text-3xl text-foam">
            🤖 LEAFWEB AI CEO
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-mist">
            Analyze a business objective, make a decision, and delegate the
            appropriate task to the Lead Generator, Sales, or Project Manager AI.
          </p>

          <textarea
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            rows={3}
            className="mt-5 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-foam outline-none focus:border-leaf"
            placeholder="What should the AI CEO focus on?"
          />
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={isPending || !objective.trim()}
          className="rounded-full border border-leaf bg-leaf px-6 py-3 text-sm font-semibold text-black transition hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "CEO Thinking..." : "Run AI CEO"}
        </button>
      </div>

      {result && (
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
          {!result.success ? (
            <div>
              <p className="text-sm font-semibold text-rose-400">
                CEO execution failed
              </p>
              <p className="mt-1 text-sm text-mist">{result.error}</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs text-leaf">
                  Priority: {result.plan?.priority}
                </span>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                  Delegate: {result.delegatedTo?.name}
                </span>

                {result.durationMs && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-mist">
                    {Math.round(result.durationMs / 1000)}s
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm font-semibold text-foam">
                {result.plan?.decision}
              </p>

              <p className="mt-2 text-sm text-mist">
                {result.plan?.reasoning}
              </p>

              <p className="mt-4 text-xs uppercase tracking-wide text-mist/60">
                Task: {result.plan?.taskType}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
