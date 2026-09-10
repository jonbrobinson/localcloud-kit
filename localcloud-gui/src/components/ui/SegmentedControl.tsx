import { cn } from "./cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  fullWidth = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Stretch to fill the parent's width instead of sizing to content — use in narrow containers like menu rows. */
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-0.5 gap-0.5 bg-surface-3 rounded-lg",
        fullWidth ? "flex w-full" : "inline-flex w-fit",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-[26px] px-3 rounded-md text-xs font-medium font-sans cursor-pointer transition-colors",
            fullWidth && "flex-1",
            value === option.value
              ? "bg-surface text-ink shadow-e1"
              : "bg-transparent text-muted hover:text-ink"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
