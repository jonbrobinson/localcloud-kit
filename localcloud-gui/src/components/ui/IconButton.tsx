"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon } from "@iconify/react";
import { cn } from "./cn";

export type IconButtonVariant = "outline" | "ghost";
export type IconButtonSize = "sm" | "md";

const variantClasses: Record<IconButtonVariant, string> = {
  outline:
    "border border-border-strong bg-surface text-ink-2 hover:bg-surface-2",
  ghost: "text-faint hover:bg-surface-3 hover:text-ink",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "w-7 h-7 rounded-md",
  md: "w-8 h-8 rounded-lg",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  /** Spins the icon in place and disables the button — use while the action it triggers is in flight. */
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "outline", size = "md", label, loading = false, disabled, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <Icon icon={icon} width={size === "sm" ? 13 : 15} className={loading ? "animate-spin" : undefined} />
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
