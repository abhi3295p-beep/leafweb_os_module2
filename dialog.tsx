"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Dialog({
  open,
  title,
  children,
  onClose,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "w-full max-w-lg rounded-2xl border border-line bg-panel p-6 text-foam backdrop:bg-black/70",
        className,
      )}
      onClose={onClose}
    >
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
