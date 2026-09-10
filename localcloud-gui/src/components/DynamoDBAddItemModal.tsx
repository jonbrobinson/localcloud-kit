"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { getDynamoDBTableSchema } from "@/services/api";
import { Button, IconButton, Input } from "./ui";

type AttributeType = "S" | "N" | "BOOL" | "M" | "L";

interface NestedAttribute {
  key: string;
  type: AttributeType;
  value?: string; // for S, N, BOOL
  children?: NestedAttribute[]; // for M, L
}

interface TableSchema {
  Table: {
    KeySchema: Array<{
      AttributeName: string;
      KeyType: "HASH" | "RANGE";
    }>;
    AttributeDefinitions: Array<{
      AttributeName: string;
      AttributeType: "S" | "N" | "B";
    }>;
  };
}

interface DynamoDBAddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Record<string, unknown>) => void;
  tableName: string;
  projectName: string;
  loading?: boolean;
}

// Recursively validate attributes — returns first error message or null
function validateAttributes(attrs: NestedAttribute[], path = ""): string | null {
  for (const attr of attrs) {
    const label = path ? `${path}.${attr.key || "item"}` : (attr.key || "item");
    if (attr.type === "N") {
      const num = Number(attr.value);
      if (attr.value === undefined || attr.value === "" || isNaN(num)) {
        return `"${label}" must be a valid number (got "${attr.value ?? ""}")`;
      }
    }
    if (attr.children?.length) {
      const childError = validateAttributes(attr.children, label);
      if (childError) return childError;
    }
  }
  return null;
}

// Helper to determine if an attribute is effectively empty and should be skipped
function isAttributeEmpty(attr: NestedAttribute): boolean {
  if (attr.type === "S" || attr.type === "N") {
    return !attr.value || attr.value === "";
  }
  if (attr.type === "BOOL") {
    return attr.value === undefined;
  }
  if ((attr.type === "M" || attr.type === "L") && (!attr.children || attr.children.length === 0)) {
    return true;
  }
  return false;
}

// Recursive builder for DynamoDB attribute
// Returns undefined when the attribute is effectively empty so it can be dropped cleanly
function buildDynamoDBAttribute(attr: NestedAttribute): unknown {
  if (isAttributeEmpty(attr)) return undefined;

  if (attr.type === "S") return { S: attr.value ?? "" };
  if (attr.type === "N") return { N: attr.value ?? "" };
  if (attr.type === "BOOL") return { BOOL: attr.value === "true" };

  if (attr.type === "M" && attr.children) {
    const mapObj: Record<string, unknown> = {};
    for (const child of attr.children) {
      if (!child.key) continue;
      const builtChild = buildDynamoDBAttribute(child);
      if (builtChild !== undefined) {
        mapObj[child.key] = builtChild;
      }
    }
    if (Object.keys(mapObj).length === 0) return undefined;
    return { M: mapObj };
  }

  if (attr.type === "L" && attr.children) {
    const builtChildren = attr.children
      .map((child) => buildDynamoDBAttribute(child))
      .filter((child) => child !== undefined);
    if (builtChildren.length === 0) return undefined;
    return { L: builtChildren };
  }

  return undefined;
}

const selectClass =
  "h-8 appearance-none rounded-lg border border-border-strong bg-surface-2 pl-2.5 pr-7 text-[13px] text-ink outline-none transition-colors focus:border-primary focus:bg-surface focus:ring-3 focus:ring-focus";

function TypeSelect({
  value,
  onChange,
  className,
}: {
  value: AttributeType;
  onChange: (value: AttributeType) => void;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AttributeType)}
        className={`${selectClass} w-full cursor-pointer`}
      >
        <option value="S">String</option>
        <option value="N">Number</option>
        <option value="BOOL">Boolean</option>
        <option value="M">Map</option>
        <option value="L">List</option>
      </select>
      <Icon
        icon="lucide:chevron-down"
        width={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}

// Recursive attribute editor
function AttributeEditor({
  attr,
  onChange,
  onRemove,
  parentType = null,
}: {
  attr: NestedAttribute;
  onChange: (attr: NestedAttribute) => void;
  onRemove?: () => void;
  parentType?: AttributeType | null;
}) {
  const handleFieldChange = (field: keyof NestedAttribute, value: unknown) => {
    onChange({ ...attr, [field]: value });
  };

  const handleChildChange = (idx: number, child: NestedAttribute) => {
    const children = attr.children ? [...attr.children] : [];
    children[idx] = child;
    onChange({ ...attr, children });
  };

  const handleAddChild = () => {
    const children = attr.children ? [...attr.children] : [];
    children.push({ key: "", type: "S" });
    onChange({ ...attr, children });
  };

  const handleRemoveChild = (idx: number) => {
    const children = attr.children ? [...attr.children] : [];
    children.splice(idx, 1);
    onChange({ ...attr, children });
  };

  return (
    <div className={`mb-2.5 rounded-lg border border-border bg-surface-2 p-3 ${parentType === "L" ? "ml-5" : ""}`}>
      <div className="flex items-center gap-2">
        {parentType !== "L" && (
          <Input
            mono
            value={attr.key}
            onChange={(e) => handleFieldChange("key", e.target.value)}
            className="w-32"
            placeholder="attribute name"
          />
        )}
        <TypeSelect value={attr.type} onChange={(value) => handleFieldChange("type", value)} className="w-[118px]" />
        {attr.type === "S" && (
          <Input
            mono
            value={attr.value ?? ""}
            onChange={(e) => handleFieldChange("value", e.target.value)}
            className="w-32"
            placeholder="value"
          />
        )}
        {attr.type === "N" && (
          <Input
            mono
            type="number"
            step="any"
            value={attr.value ?? ""}
            onChange={(e) => handleFieldChange("value", e.target.value)}
            className="w-32"
            placeholder="0"
          />
        )}
        {attr.type === "BOOL" && (
          <div className="relative">
            <select
              value={attr.value ?? "true"}
              onChange={(e) => handleFieldChange("value", e.target.value)}
              className={`${selectClass} w-24 cursor-pointer font-mono`}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
            <Icon
              icon="lucide:chevron-down"
              width={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint"
            />
          </div>
        )}
        {onRemove && (
          <IconButton
            icon="lucide:trash-2"
            variant="ghost"
            size="sm"
            label="Remove attribute"
            className="ml-auto !text-danger hover:!bg-danger-soft hover:!text-danger"
            onClick={onRemove}
          />
        )}
      </div>
      {(attr.type === "M" || attr.type === "L") && (
        <div className="mt-2.5 border-l-2 border-primary-soft pl-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-2">{attr.type === "M" ? "Map items" : "List items"}</span>
            <Button type="button" variant="secondary" size="sm" icon="lucide:plus" onClick={handleAddChild}>
              Add item
            </Button>
          </div>
          {attr.children?.map((child, idx) => (
            <AttributeEditor
              key={idx}
              attr={child}
              onChange={(updated) => handleChildChange(idx, updated)}
              onRemove={() => handleRemoveChild(idx)}
              parentType={attr.type}
            />
          ))}
        </div>
      )}
      {isAttributeEmpty(attr) && (
        <p className="mt-1.5 text-[11px] text-warn-ink">This attribute is empty and will not be saved.</p>
      )}
    </div>
  );
}

export default function DynamoDBAddItemModal({
  isOpen,
  onClose,
  onSubmit,
  tableName,
  projectName,
  loading = false,
}: DynamoDBAddItemModalProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [attributes, setAttributes] = useState<NestedAttribute[]>([]);
  const [error, setError] = useState("");

  const loadTableSchema = useCallback(async () => {
    setSchemaLoading(true);
    setError("");
    try {
      const response = await getDynamoDBTableSchema(projectName, tableName);
      if (response.success) {
        setSchema(response.data);
        // Initialize key values
        const initialKeys: Record<string, string> = {};
        response.data.Table.KeySchema.forEach(
          (key: { AttributeName: string }) => {
            initialKeys[key.AttributeName] = "";
          }
        );
        setKeyValues(initialKeys);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load table schema");
    } finally {
      setSchemaLoading(false);
    }
  }, [projectName, tableName]);

  useEffect(() => {
    if (isOpen && tableName) {
      loadTableSchema();
    }
  }, [isOpen, tableName, loadTableSchema]);

  // Reset form state each time the modal is opened so previous values don't persist
  useEffect(() => {
    if (isOpen) {
      setKeyValues({});
      setAttributes([]);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: "", type: "S" }]);
  };

  const handleKeyValueChange = (keyName: string, value: string) => {
    setKeyValues((prev) => ({ ...prev, [keyName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required keys
    if (!schema) {
      setError("Table schema not loaded");
      return;
    }

    const missingKeys = schema.Table.KeySchema.filter(
      (key) => !keyValues[key.AttributeName]
    );
    if (missingKeys.length > 0) {
      setError(
        `Required keys missing: ${missingKeys
          .map((k) => k.AttributeName)
          .join(", ")}`
      );
      return;
    }

    // Validate number fields recursively before sending
    const validationError = validateAttributes(attributes);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Build item in DynamoDB format
    const item: Record<string, unknown> = {};

    // Add key values
    schema.Table.KeySchema.forEach((key: { AttributeName: string }) => {
      item[key.AttributeName] = { S: keyValues[key.AttributeName] };
    });

    // Add custom attributes (skip empty ones)
    for (const attr of attributes) {
      if (!attr.key) continue;
      const built = buildDynamoDBAttribute(attr);
      if (built === undefined) continue;
      item[attr.key] = built;
    }

    onSubmit(item);
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-scrim p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-e3">
        {/* Header — always visible */}
        <div className="flex items-start gap-2.5 border-b border-divider px-4.5 py-3.5 shrink-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon icon="lucide:plus" width={16} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">Add item</span>
            <span className="font-mono text-[11px] text-muted">{tableName}</span>
          </div>
          <IconButton
            icon="lucide:x"
            variant="ghost"
            size="sm"
            label="Close"
            className="ml-auto"
            onClick={onClose}
          />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4.5 py-4">
          {schemaLoading ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Icon icon="lucide:loader-2" width={22} className="animate-spin text-primary" />
              <p className="text-sm text-muted">Loading table schema…</p>
            </div>
          ) : schema ? (
            <form id="add-item-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Key Fields */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-medium text-ink-2">Required keys</span>
                {schema.Table.KeySchema.map((key) => (
                  <label key={key.AttributeName} className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted">
                      {key.AttributeName}{" "}
                      <span className="text-faint">({key.KeyType === "HASH" ? "Partition key" : "Sort key"})</span>
                    </span>
                    <Input
                      mono
                      value={keyValues[key.AttributeName] || ""}
                      onChange={(e) => handleKeyValueChange(key.AttributeName, e.target.value)}
                      required
                    />
                  </label>
                ))}
              </div>

              {/* Custom Attributes */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ink-2">Custom attributes</span>
                {attributes.map((attr, idx) => (
                  <AttributeEditor
                    key={idx}
                    attr={attr}
                    onChange={(updated) => {
                      const updatedAttrs = [...attributes];
                      updatedAttrs[idx] = updated;
                      setAttributes(updatedAttrs);
                    }}
                    onRemove={() =>
                      setAttributes(attributes.filter((_, i) => i !== idx))
                    }
                  />
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon="lucide:plus"
                  onClick={handleAddAttribute}
                  className="w-fit"
                >
                  Add attribute
                </Button>
              </div>

              {error && <div className="text-sm text-danger">{error}</div>}
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-danger">Failed to load table schema</p>
              <Button type="button" variant="primary" size="sm" onClick={loadTableSchema}>
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Footer — always visible, pinned to bottom */}
        {schema && !schemaLoading && (
          <div className="flex items-center justify-end gap-2.5 border-t border-divider bg-surface-2 px-4.5 py-3.5 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" form="add-item-form" variant="primary" icon="lucide:plus" loading={loading}>
              {loading ? "Adding…" : "Add item"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
