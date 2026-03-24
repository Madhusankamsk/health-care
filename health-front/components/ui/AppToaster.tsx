"use client";

import { Toaster } from "sonner";

/**
 * Renders after `{children}` in root layout so the portal stacks above route content.
 * Offset clears the sticky dashboard header (~56–64px).
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="system"
      duration={4000}
      offset={{ top: "4.5rem", right: "1rem" }}
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]",
          description: "text-[var(--text-secondary)]",
        },
      }}
    />
  );
}
