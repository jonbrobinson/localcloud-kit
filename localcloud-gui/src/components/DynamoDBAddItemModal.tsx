"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getDynamoDBTableSchema } from "@/services/api";

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
  onSubmit: (item: Record<string, any>) => void;
  tableName: string;
  projectName: string;
  loading?: boolean;
}

// Recursive builder for DynamoDB attribute
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDynamoDBAttribute(attr: NestedAttribute): any {
  if (attr.type === "S") return { S: attr.value ?? "" };
  if (attr.type === "N") return { N: attr.value ?? "" };
  if (attr.type === "BOOL") return { BOOL: attr.value === "true" };
  if (attr.type === "M" && attr.children) {
    const mapObj: Record<string, any> = {};
    for (const child of attr.children) {
      if (!child.key) continue;
      mapObj[child.key] = buildDynamoDBAttribute(child);
    }
    return { M: mapObj };
  }
  if (attr.type === "L" && attr.children) {
    return { L: attr.children.map(buildDynamoDBAttribute) };
  }
  return undefined;
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
  const handleFieldChange = (field: keyof NestedAttribute, value: any) => {
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
    <div
      className={`border border-gray-200 rounded-md p-3 mb-3 ${
        parentType === "L" ? "ml-6" : ""
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        {parentType !== "L" && (
          <input
            type="text"
            value={attr.key}
            onChange={(e) => handleFieldChange("key", e.target.value)}
            className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="Attribute Name"
          />
        )}
        <select
          value={attr.type}
          onChange={(e) => handleFieldChange("type", e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="S">String</option>
          <option value="N">Number</option>
          <option value="BOOL">Boolean</option>
          <option value="M">Map</option>
          <option value="L">List</option>
        </select>
        {attr.type !== "M" && attr.type !== "L" && (
          <input
            type="text"
            value={attr.value ?? ""}
            onChange={(e) => handleFieldChange("value", e.target.value)}
            className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="Value"
          />
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
            aria-label="Remove"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {(attr.type === "M" || attr.type === "L") && (
        <div className="ml-4 border-l-2 border-blue-200 pl-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {attr.type === "M" ? "Map Items" : "List Items"}
            </span>
            <button
              type="button"
              onClick={handleAddChild}
              className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Add Item
            </button>
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

  useEffect(() => {
    if (isOpen && tableName) {
      loadTableSchema();
    }
  }, [isOpen, tableName]);

  const loadTableSchema = async () => {
    setSchemaLoading(true);
    setError("");
    try {
      const response = await getDynamoDBTableSchema(projectName, tableName);
      if (response.success) {
        setSchema(response.data);
        // Initialize key values
        const initialKeys: Record<string, string> = {};
        response.data.Table.KeySchema.forEach((key) => {
          initialKeys[key.AttributeName] = "";
        });
        setKeyValues(initialKeys);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load table schema");
    } finally {
      setSchemaLoading(false);
    }
  };

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

    // Build item in DynamoDB format
    const item: Record<string, any> = {};

    // Add key values
    schema.Table.KeySchema.forEach((key) => {
      item[key.AttributeName] = { S: keyValues[key.AttributeName] };
    });

    // Add custom attributes
    for (const attr of attributes) {
      if (!attr.key) continue;
      item[attr.key] = buildDynamoDBAttribute(attr);
    }

    onSubmit(item);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Item to {tableName}
        </h2>

        {schemaLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading table schema...</p>
          </div>
        ) : schema ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Key Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Keys
              </label>
              {schema.Table.KeySchema.map((key) => (
                <div key={key.AttributeName} className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.AttributeName} (
                    {key.KeyType === "HASH" ? "Partition Key" : "Sort Key"})
                  </label>
                  <input
                    type="text"
                    value={keyValues[key.AttributeName] || ""}
                    onChange={(e) =>
                      handleKeyValueChange(key.AttributeName, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
              ))}
            </div>

            {/* Custom Attributes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Attributes
              </label>
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
              <button
                type="button"
                onClick={handleAddAttribute}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-2"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Attribute
              </button>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load table schema</p>
            <button
              onClick={loadTableSchema}
              className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
 