import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";

export interface TableProps {
  children: ReactNode;
  className?: string;
}

/** One panel per resource type — 36px rows, never an uppercase group row inside the table. */
export function Table({ children, className }: TableProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow-e1", className)}>
      {children}
    </div>
  );
}

function TablePanelHeader({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
      {icon}
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-ink">{title}</span>
        {subtitle && <span className="text-[11px] text-muted">{subtitle}</span>}
      </span>
      {children && <div className="ml-auto flex items-center gap-1.5">{children}</div>}
    </div>
  );
}

function TableHeaderRow({ columns, children }: { columns: string; children: ReactNode }) {
  const style: CSSProperties = { gridTemplateColumns: columns };
  return (
    <div
      className="grid items-center gap-x-3 border-y border-divider bg-surface-2 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint"
      style={style}
    >
      {children}
    </div>
  );
}

function TableRow({
  columns,
  selected = false,
  className,
  children,
}: {
  columns: string;
  selected?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const style: CSSProperties = { gridTemplateColumns: columns };
  return (
    <div
      className={cn(
        "grid h-9 items-center gap-x-3 border-b border-divider px-4",
        selected ? "bg-primary-soft" : "hover:bg-surface-2",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

function TableSelectionBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-border bg-primary-soft px-4 py-2.5">
      {children}
    </div>
  );
}

Table.PanelHeader = TablePanelHeader;
Table.HeaderRow = TableHeaderRow;
Table.Row = TableRow;
Table.SelectionBar = TableSelectionBar;
