import type { InputHTMLAttributes } from "react";
import { Icon } from "@iconify/react";
import { cn } from "./cn";

export function SearchInput({
  className,
  containerClassName,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { containerClassName?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border-strong bg-surface-2 min-w-[160px]",
        containerClassName
      )}
    >
      <Icon icon="lucide:search" width={14} className="text-faint shrink-0" />
      <input
        className={cn(
          "flex-1 min-w-0 border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint",
          className
        )}
        {...props}
      />
    </div>
  );
}
