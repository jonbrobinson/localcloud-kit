"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon } from "@iconify/react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:hover:bg-primary",
  secondary:
    "border border-border-strong bg-surface text-ink-2 hover:bg-surface-2 disabled:hover:bg-surface",
  ghost:
    "text-muted hover:bg-surface-3 hover:text-ink disabled:hover:bg-transparent disabled:hover:text-muted",
  danger: "bg-danger text-white hover:bg-danger-hover disabled:hover:bg-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-8 px-3.5 text-[13px] gap-1.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-sans font-medium whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Icon icon="lucide:loader-2" width={size === "sm" ? 13 : 15} className="animate-spin" />
        ) : icon ? (
          <Icon icon={icon} width={size === "sm" ? 13 : 15} />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
