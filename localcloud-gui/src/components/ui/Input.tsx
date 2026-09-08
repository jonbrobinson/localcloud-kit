import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ mono = false, invalid = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-8 px-2.5 rounded-lg border bg-surface-2 text-[13px] text-ink outline-none transition-colors placeholder:text-faint",
          "focus:bg-surface focus:ring-3 focus:ring-focus",
          mono && "font-mono",
          invalid
            ? "border-danger focus:border-danger"
            : "border-border-strong focus:border-primary",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
