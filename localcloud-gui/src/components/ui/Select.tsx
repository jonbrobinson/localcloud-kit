"use client";

import { useMemo, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { Icon } from "@iconify/react";
import { cn } from "./cn";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  /** Iconify icon id, e.g. "logos:aws-s3" */
  icon?: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps {
  value: string | null;
  onChange: (value: string) => void;
  /** Flat option list. Use `groups` instead for a grouped menu. */
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/** Replaces the native <select> — grouped, searchable past 8 items, brand-mark aware. */
export function Select({
  value,
  onChange,
  options,
  groups,
  placeholder = "Select…",
  disabled = false,
  invalid = false,
  className,
  id,
  ...rest
}: SelectProps) {
  const [query, setQuery] = useState("");

  const resolvedGroups: SelectGroup[] = useMemo(
    () => groups ?? [{ label: "", options: options ?? [] }],
    [groups, options]
  );

  const flatOptions = useMemo(() => resolvedGroups.flatMap((g) => g.options), [resolvedGroups]);
  const searchable = flatOptions.length >= 8;

  const filteredGroups = useMemo(() => {
    if (!searchable || !query.trim()) return resolvedGroups;
    const q = query.trim().toLowerCase();
    return resolvedGroups
      .map((g) => ({ ...g, options: g.options.filter((o) => o.label.toLowerCase().includes(q)) }))
      .filter((g) => g.options.length > 0);
  }, [resolvedGroups, query, searchable]);

  const filteredCount = filteredGroups.reduce((n, g) => n + g.options.length, 0);
  const selected = flatOptions.find((o) => o.value === value) ?? null;

  return (
    <Listbox value={value ?? ""} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className={cn("relative", className)}>
          <ListboxButton
            id={id}
            aria-label={rest["aria-label"]}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-2 rounded-lg border px-2.5 text-[13px] outline-none transition-colors",
              disabled
                ? "cursor-not-allowed border-border bg-surface-3 text-faint"
                : "cursor-pointer text-ink",
              !disabled && open
                ? "border-primary bg-surface ring-3 ring-focus"
                : !disabled &&
                    (invalid
                      ? "border-danger bg-surface-2 hover:border-danger"
                      : "border-border-strong bg-surface-2 hover:border-ink-2 hover:bg-surface")
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {selected?.icon && <Icon icon={selected.icon} width={14} className="shrink-0" />}
              <span className={cn("truncate", !selected && "text-faint")}>
                {selected ? selected.label : placeholder}
              </span>
            </span>
            <Icon
              icon={open ? "lucide:chevron-up" : "lucide:chevron-down"}
              width={14}
              className="shrink-0 text-faint"
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className={cn(
              "absolute z-50 mt-1 w-full rounded-xl border border-border bg-surface shadow-e2 outline-none",
              "transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            )}
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-divider bg-surface-2 px-2.5 py-2">
                <Icon icon="lucide:search" width={14} className="shrink-0 text-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search…"
                  className="min-w-0 flex-1 border-none bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-faint placeholder:font-sans"
                />
                <span className="shrink-0 text-[11px] text-faint">
                  {filteredCount} of {flatOptions.length}
                </span>
              </div>
            )}

            <div className="flex max-h-[240px] flex-col overflow-auto p-1">
              {filteredCount === 0 ? (
                <div className="px-2.5 py-4 text-center text-[12px] text-faint">No matches</div>
              ) : (
                filteredGroups.map((group, gi) => (
                  <div key={group.label || gi}>
                    {group.label && (
                      <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-faint first:pt-1.5">
                        {group.label}
                      </div>
                    )}
                    {group.options.map((option) => (
                      <ListboxOption
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] outline-none",
                          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                          "data-[focus]:bg-surface-3",
                          "data-[selected]:bg-primary-soft"
                        )}
                      >
                        {option.icon && <Icon icon={option.icon} width={17} className="shrink-0" />}
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className={cn(
                              "truncate font-medium",
                              option.value === value ? "text-primary-ink" : "text-ink"
                            )}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span
                              className={cn(
                                "truncate text-[11px]",
                                option.value === value ? "text-primary" : "text-muted"
                              )}
                            >
                              {option.description}
                            </span>
                          )}
                        </span>
                        {option.value === value && (
                          <Icon icon="lucide:check" width={15} className="ml-auto shrink-0 text-primary" />
                        )}
                      </ListboxOption>
                    ))}
                  </div>
                ))
              )}
            </div>

            {searchable && (
              <div className="flex gap-2.5 border-t border-divider bg-surface-2 px-2.5 py-1.5 text-[10px] text-faint">
                <span>
                  <span className="font-mono text-muted">↑↓</span> move
                </span>
                <span>
                  <span className="font-mono text-muted">↵</span> select
                </span>
                <span>
                  <span className="font-mono text-muted">esc</span> close
                </span>
              </div>
            )}
          </ListboxOptions>
        </div>
      )}
    </Listbox>
  );
}
