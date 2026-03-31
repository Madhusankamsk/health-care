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
    "bg-[var(--brand-primary)] text-white shadow-sm hover:bg-[var(--brand-primary-strong)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
  create:
    "bg-[var(--action-create)] text-white shadow-sm hover:bg-[var(--action-create-hover)]",
  edit:
    "bg-[var(--action-edit)] text-white shadow-sm hover:bg-[var(--action-edit-hover)]",
  delete:
    "bg-[var(--action-delete)] text-white shadow-sm hover:bg-[var(--action-delete-hover)]",
  preview:
    "bg-[var(--action-preview)] text-white shadow-sm hover:bg-[var(--action-preview-hover)]",
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
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
        "transition-all duration-150 focus-visible:outline-none active:translate-y-px",
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
