import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      {label ? (
        <span className="text-sm text-mist">{label}</span>
      ) : null}
      <input
        id={id}
        className={cn(
          "h-11 w-full rounded-xl border border-line bg-ink px-3 text-sm text-foam outline-none transition focus:border-leaf/60 focus:ring-2 focus:ring-leaf/20",
          error && "border-rose-500",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
