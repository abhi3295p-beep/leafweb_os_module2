import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const tones = {
  leaf: "bg-leaf/15 text-leaf",
  mist: "bg-white/8 text-mist",
  gold: "bg-gold/15 text-gold",
  rose: "bg-rose-500/15 text-rose-300",
};

export function Badge({
  className,
  tone = "mist",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
