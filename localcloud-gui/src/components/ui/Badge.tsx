import type { ReactNode } from "react";
import { cn } from "./cn";
import { StatusDot, type StatusTone } from "./StatusDot";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-soft text-success-ink",
  danger: "bg-danger-soft text-danger-ink",
  warn: "bg-warn-soft text-warn-ink",
  neutral: "bg-surface-3 text-muted",
};

export function Badge({
  tone,
  pulse = false,
  children,
  className,
}: {
  tone: StatusTone;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      <StatusDot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}
