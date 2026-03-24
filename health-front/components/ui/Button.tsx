import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "create"
  | "edit"
  | "delete"
  | "preview";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: ReactNode;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white shadow-sm hover:bg-[var(--brand-primary-strong)] focus-visible:ring-[var(--brand-primary)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:ring-[var(--brand-primary)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:ring-[var(--brand-primary)]",
  create:
    "bg-[var(--action-create)] text-white shadow-sm hover:bg-[var(--action-create-hover)] focus-visible:ring-[var(--action-create)]",
  edit:
    "bg-[var(--action-edit)] text-white shadow-sm hover:bg-[var(--action-edit-hover)] focus-visible:ring-[var(--action-edit)]",
  delete:
    "bg-[var(--action-delete)] text-white shadow-sm hover:bg-[var(--action-delete-hover)] focus-visible:ring-[var(--action-delete)]",
  preview:
    "bg-[var(--action-preview)] text-white shadow-sm hover:bg-[var(--action-preview-hover)] focus-visible:ring-[var(--action-preview)]",
};

export function Button({
  className,
  variant = "primary",
  isLoading,
  leftIcon,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold tracking-wide",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {leftIcon}
      {isLoading ? "Please wait…" : children}
    </button>
  );
}
