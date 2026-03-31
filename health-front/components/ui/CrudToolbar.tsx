import type { ReactNode } from "react";

type CrudToolbarProps = {
  description: string;
  children: ReactNode;
};

export function CrudToolbar({ description, children }: CrudToolbarProps) {
  return (
    <div className="page-section flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="text-sm text-[var(--text-secondary)]">{description}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
