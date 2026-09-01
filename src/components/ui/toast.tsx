"use client";

import type { ReactNode } from "react";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useToast() {
  return {
    push: () => undefined,
  };
}
