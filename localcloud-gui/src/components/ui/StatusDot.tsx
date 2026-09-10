import { cn } from "./cn";

export type StatusTone = "success" | "danger" | "warn" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warn: "bg-warn",
  neutral: "bg-faint",
};

export function StatusDot({
  tone,
  pulse = false,
  className,
}: {
  tone: StatusTone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full",
        toneClasses[tone],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}
