import type { ReactNode } from "react";

type CrudToolbarProps = {
  description: string;
  children: ReactNode;
};

export function CrudToolbar({ description, children }: CrudToolbarProps) {
  return (
    <div className="page-section flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0 text-sm text-[var(--text-secondary)]">{description}</div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {children}
      </div>
    </div>
  );
}
