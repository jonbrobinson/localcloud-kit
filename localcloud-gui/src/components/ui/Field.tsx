import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { cn } from "./cn";

export interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/** Label above, hint below, error replaces the hint — wraps Input/Select/Textarea. */
export function Field({ label, required = false, hint, error, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11px] text-danger">
          <Icon icon="lucide:alert-circle" width={12} />
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
