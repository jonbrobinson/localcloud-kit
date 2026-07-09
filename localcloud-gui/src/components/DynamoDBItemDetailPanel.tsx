"use client";

import { useState } from "react";
import {
  ArrowsPointingOutIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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

function CopyableField({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
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
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {value ? (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title={copied ? "Copied" : `Copy ${label}`}
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>
      {value ? (
        <div
          className={`break-all font-mono text-xs leading-relaxed ${
            emphasize
              ? "rounded-md border border-blue-200 bg-blue-50 px-2.5 py-2 text-blue-900"
              : "text-gray-700"
          }`}
        >
          {value}
        </div>
      ) : (
        <p className="text-xs italic text-gray-400">empty</p>
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
  const keySet = new Set(keyColumnNames);
  const attributeNames = Object.keys(item)
    .filter((name) => !keySet.has(name))
    .sort();

  const headerAccent =
    accent === "indigo"
      ? "border-indigo-100 bg-indigo-50 text-indigo-900"
      : "border-blue-100 bg-blue-50 text-blue-900";

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className={`flex items-start justify-between gap-2 border-b px-4 py-3 ${headerAccent}`}>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Item detail</p>
          <p className="truncate text-sm font-medium">{tableName}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-600"
            aria-label="Close item detail"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {keyColumnNames.map((name) => {
          const keyType = getKeyType?.(name);
          const label = keyType ? `${name} (${keyType})` : name;
          return (
            <CopyableField
              key={name}
              label={label}
              value={formatScalar(item[name])}
              emphasize
            />
          );
        })}

        {attributeNames.length > 0 ? (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Attributes
            </p>
            <div className="space-y-4">
              {attributeNames.map((name) => {
                const value = item[name];
                const isComplex = value !== null && typeof value === "object";

                if (isComplex && onJsonClick) {
                  return (
                    <div key={name}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {name}
                      </p>
                      <button
                        type="button"
                        onClick={() => onJsonClick(value, `${name} - ${tableName}`)}
                        className={`flex max-w-full items-center gap-1.5 rounded border px-2 py-1 text-left font-mono text-xs transition-colors ${
                          accent === "indigo"
                            ? "border-indigo-200 bg-indigo-50 text-gray-800 hover:bg-indigo-100"
                            : "border-blue-200 bg-blue-50 text-gray-800 hover:bg-blue-100"
                        }`}
                        title="Click to view full JSON"
                      >
                        <ArrowsPointingOutIcon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            accent === "indigo" ? "text-indigo-600" : "text-blue-600"
                          }`}
                        />
                        <span className="truncate">{formatScalar(value)}</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <CopyableField
                    key={name}
                    label={name}
                    value={formatScalar(value)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {onDelete ? (
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete item
          </button>
        </div>
      ) : null}
    </aside>
  );
}
