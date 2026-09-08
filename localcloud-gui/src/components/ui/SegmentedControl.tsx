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
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex p-0.5 gap-0.5 bg-surface-3 rounded-lg w-fit",
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
