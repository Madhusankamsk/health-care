import type { ReactNode } from "react";

type CrudToolbarProps = {
  title?: string;
  note?: string;
  description?: string;
  children?: ReactNode;
};

export function CrudToolbar({ title, note, description, children }: CrudToolbarProps) {
  const helperText = note ?? description;

  return (
    <div className="flex flex-col gap-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:py-2">
      {(title || helperText) && (
        <div className="min-w-0">
          {title ? (
            <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">{title}</h2>
          ) : null}
          {helperText ? (
            <p className="text-xs text-[var(--text-secondary)] sm:text-sm">{helperText}</p>
          ) : null}
        </div>
      )}
      {children ? (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {children}
        </div>
      ) : null}
    </div>
  );
}
