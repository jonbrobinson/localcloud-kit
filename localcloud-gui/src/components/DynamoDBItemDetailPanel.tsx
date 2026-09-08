"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { IconButton } from "./ui";

type DynamoDBItem = Record<string, unknown>;

interface DynamoDBItemDetailPanelProps {
  item: DynamoDBItem;
  tableName: string;
  keyColumnNames: string[];
  getKeyType?: (columnName: string) => string;
  onDelete?: () => void;
  onClose?: () => void;
  onJsonClick?: (data: unknown, title: string) => void;
  accent?: "blue" | "indigo";
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function typeLetter(value: unknown): string {
  if (value === null || value === undefined) return "S";
  if (typeof value === "number") return "N";
  if (typeof value === "boolean") return "BOOL";
  if (Array.isArray(value)) return "L";
  if (typeof value === "object") return "M";
  return "S";
}

function CopyableField({
  label,
  type,
  value,
}: {
  label: string;
  type: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="grid grid-cols-[100px_1fr] items-start gap-2.5 border-b border-divider px-3.5 py-2.5 last:border-b-0">
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        {label}
        <span className="text-faint">{type}</span>
      </span>
      {value ? (
        <div className="flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0 break-all font-mono text-xs leading-relaxed text-ink">{value}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 cursor-pointer rounded p-0.5 text-faint transition-colors hover:bg-surface-3 hover:text-ink"
            title={copied ? "Copied" : `Copy ${label}`}
          >
            <Icon icon={copied ? "lucide:check" : "lucide:copy"} width={12} className={copied ? "text-success" : ""} />
          </button>
        </div>
      ) : (
        <span className="text-xs italic text-faint">empty</span>
      )}
    </div>
  );
}

export default function DynamoDBItemDetailPanel({
  item,
  tableName,
  keyColumnNames,
  getKeyType,
  onDelete,
  onClose,
  onJsonClick,
  accent = "blue",
}: DynamoDBItemDetailPanelProps) {
  void accent;

  const keySet = new Set(keyColumnNames);
  const attributeNames = Object.keys(item)
    .filter((name) => !keySet.has(name))
    .sort();

  const summary = keyColumnNames
    .map((name) => formatScalar(item[name]))
    .filter(Boolean)
    .join(" / ");

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-e1">
      <div className="flex items-center gap-2.5 border-b border-divider px-3.5 py-3">
        <span className="text-sm font-semibold text-ink">Item</span>
        {summary ? (
          <span className="truncate font-mono text-[11px] text-muted">{summary}</span>
        ) : null}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <IconButton
            icon="lucide:copy"
            variant="ghost"
            size="sm"
            label="Copy item JSON"
            onClick={() => {
              void navigator.clipboard.writeText(JSON.stringify(item, null, 2));
            }}
          />
          {onDelete ? (
            <IconButton
              icon="lucide:trash-2"
              variant="ghost"
              size="sm"
              label="Delete item"
              className="!text-danger hover:!bg-danger-soft hover:!text-danger"
              onClick={onDelete}
            />
          ) : null}
          {onClose ? (
            <IconButton icon="lucide:x" variant="ghost" size="sm" label="Close item detail" onClick={onClose} />
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {keyColumnNames.map((name) => {
            const keyType = getKeyType?.(name);
            const value = item[name];
            return (
              <div
                key={name}
                className="grid grid-cols-[100px_1fr] items-start gap-2.5 border-b border-divider px-3.5 py-2.5"
              >
                <span className="flex items-center gap-1.5 text-[11px] text-muted" title={keyType}>
                  {name}
                  <span className="text-faint">{typeLetter(value)}</span>
                </span>
                <span className="break-all font-mono text-xs text-ink">{formatScalar(value)}</span>
              </div>
            );
          })}

          {attributeNames.map((name) => {
            const value = item[name];
            const isComplex = value !== null && typeof value === "object";

            if (isComplex && onJsonClick) {
              return (
                <div
                  key={name}
                  className="grid grid-cols-[100px_1fr] items-center gap-2.5 border-b border-divider px-3.5 py-2.5"
                >
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    {name}
                    <span className="text-faint">{typeLetter(value)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onJsonClick(value, `${name} - ${tableName}`)}
                    className="flex max-w-full cursor-pointer items-center gap-1.5 justify-self-start rounded border border-primary bg-primary-soft px-2 py-1 text-left font-mono text-xs text-primary-ink transition-colors hover:bg-primary/10"
                    title="Click to view full JSON"
                  >
                    <Icon icon="lucide:maximize-2" width={12} className="shrink-0 text-primary" />
                    <span className="truncate">{formatScalar(value)}</span>
                  </button>
                </div>
              );
            }

            return (
              <CopyableField key={name} label={name} type={typeLetter(value)} value={formatScalar(value)} />
            );
          })}
        </div>

        <pre className="m-0 max-h-[220px] overflow-auto border-t border-divider bg-surface-2 px-3.5 py-3 font-mono text-[11px] leading-relaxed text-ink-2">
          {JSON.stringify(item, null, 2)}
        </pre>
      </div>
    </aside>
  );
}
