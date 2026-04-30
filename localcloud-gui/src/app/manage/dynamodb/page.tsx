"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  CircleStackIcon,
  ArrowPathIcon,
  BookOpenIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { resourceApi } from "@/services/api";
import ManageHeaderBrand from "@/components/ManageHeaderBrand";
import { DynamoDBTableConfig } from "@/types";
import DynamoDBConfigModal from "@/components/DynamoDBConfigModal";
import DynamoDBAddItemModal from "@/components/DynamoDBAddItemModal";
import SystemLogsButton from "@/components/SystemLogsButton";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { parseDynamoDBItem } from "@/lib/dynamodbValue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamoDBItem = Record<string, any>;

function formatDisplayValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

// Extract the raw string/number value from a DynamoDB typed attribute for use in key expressions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDynamoDBKeyValue(val: any): string {
  if (val === undefined || val === null) return "";
  if (typeof val !== "object") return String(val);
  return val.S ?? val.N ?? String(val);
}

interface TableInfo {
  TableName: string;
  TableStatus?: string;
  ItemCount?: number;
  TableSizeBytes?: number;
  CreationDateTime?: string;
}

const projectName = "default";

export default function ManageDynamoDBPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [items, setItems] = useState<DynamoDBItem[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleteItemTarget, setDeleteItemTarget] = useState<DynamoDBItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [schema, setSchema] = useState<{ pk: string; sk?: string } | null>(null);
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [selectedJsonData, setSelectedJsonData] = useState<unknown>(null);
  const [selectedJsonTitle, setSelectedJsonTitle] = useState("");

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const res = await fetch(`/api/dynamodb/tables?projectName=${encodeURIComponent(projectName)}`);
      const result = await res.json();
      if (result.success) {
        setTables((result.data as string[])?.map((n: string) => ({ TableName: n })) || []);
      } else {
        toast.error("Failed to load tables");
      }
    } catch {
      toast.error("Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadTableSchema = async (tableName: string) => {
    try {
      const res = await fetch(
        `/api/dynamodb/table/${encodeURIComponent(
          tableName
        )}/schema?projectName=${encodeURIComponent(projectName)}`
      );
      const result = await res.json();
      if (result.success && result.data?.Table?.KeySchema) {
        const ks = result.data.Table.KeySchema;
        const pk = ks.find((k: { KeyType: string; AttributeName: string }) => k.KeyType === "HASH")?.AttributeName || "id";
        const sk = ks.find((k: { KeyType: string; AttributeName: string }) => k.KeyType === "RANGE")?.AttributeName;
        setSchema({ pk, sk });
      }
    } catch {
      // ignore — schema is optional for display
    }
  };

  const loadItems = useCallback(async (tableName: string) => {
    setLoadingItems(true);
    try {
      const res = await fetch(
        `/api/dynamodb/table/${encodeURIComponent(
          tableName
        )}/scan?projectName=${encodeURIComponent(projectName)}`
      );
      const result = await res.json();
      if (result.success) {
        // Parse DynamoDB typed values recursively for consistent map/list rendering.
        const parsedItems = (result.data?.Items || result.data?.items || []).map(parseDynamoDBItem);
        setItems(parsedItems);
      } else {
        toast.error("Failed to load items");
      }
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const selectTable = async (name: string) => {
    setSelectedTable(name);
    setItems([]);
    setSchema(null);
    await Promise.all([loadItems(name), loadTableSchema(name)]);
  };

  const handleCreate = async (config: DynamoDBTableConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "dynamodb", { dynamodbConfig: config });
      if (res.success) {
        toast.success("Table created");
        setShowCreate(false);
        setTimeout(loadTables, 800);
      } else {
        toast.error(res.error || "Failed to create table");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create table");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedTable || !deleteItemTarget) return;
    if (!schema) {
      toast.error("Unable to load table key schema. Refresh and try again.");
      return;
    }
    setDeleteLoading(true);
    try {
      const partitionValue = extractDynamoDBKeyValue(deleteItemTarget[schema.pk]);
      const sortKeyName = schema.sk;
      const hasSortKey = typeof sortKeyName === "string" && sortKeyName.length > 0;
      const sortValue = hasSortKey
        ? extractDynamoDBKeyValue(deleteItemTarget[sortKeyName])
        : undefined;
      const res = await fetch(`/api/dynamodb/table/${encodeURIComponent(selectedTable)}/item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          partitionKey: schema.pk,
          partitionValue,
          ...(hasSortKey ? { sortKey: sortKeyName, sortValue } : {}),
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Item deleted");
        setDeleteItemTarget(null);
        loadItems(selectedTable);
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeleteLoading(false);
    }
  };

  const allKeys = items.length > 0 ? Array.from(new Set(items.flatMap(Object.keys))) : [];

  const handleJsonClick = (data: unknown, title: string) => {
    setSelectedJsonData(data);
    setSelectedJsonTitle(title);
    setJsonViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <ManageHeaderBrand />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Manage tables</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <SystemLogsButton />
              <Link href="/dynamodb" className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <BookOpenIcon className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  void loadTables();
                  if (selectedTable) void loadItems(selectedTable);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Refresh tables and items"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${loadingTables || loadingItems ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Table</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tables ({tables.length})</p>
          </div>
          {loadingTables ? (
            <div className="p-4 space-y-2">
              {[0,1,2].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : tables.length === 0 ? (
            <div className="p-6 text-center">
              <CircleStackIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No tables</p>
            </div>
          ) : (
            <ul className="py-1">
              {tables.map((t) => (
                <li key={t.TableName}>
                  <button
                    onClick={() => selectTable(t.TableName)}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm text-left transition-colors ${
                      selectedTable === t.TableName
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <CircleStackIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t.TableName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Items panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedTable ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-24">
              <CircleStackIcon className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">Select a table to view and manage items</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="shrink-0 text-base font-semibold text-gray-900">{selectedTable}</h2>
                  {schema && (
                    <span className="min-w-0 truncate text-xs text-gray-400 font-mono">
                      PK: {schema.pk}
                      {schema.sk ? ` · SK: ${schema.sk}` : ""}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-gray-400">{items.length} items</span>
                </div>
                <div className="flex shrink-0 items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddItem(true)}
                    className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {loadingItems ? (
                <div className="space-y-2">
                  {[0,1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No items in this table</p>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-3.5 w-3.5 mr-1" />
                    Add first item
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {allKeys.map((k) => (
                          <th key={k} className="px-4 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {allKeys.map((k) => {
                            const value = item[k];
                            const isComplexValue = value !== null && typeof value === "object";
                            return (
                              <td
                                key={k}
                                className={`px-4 py-2.5 align-top ${
                                  isComplexValue ? "text-gray-700" : "text-xs font-mono text-gray-700"
                                }`}
                              >
                                {isComplexValue ? (
                                  <button
                                    type="button"
                                    onClick={() => handleJsonClick(value, `${k} - ${selectedTable}`)}
                                    className="flex max-w-xs items-center gap-1.5 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-left font-mono text-xs text-gray-800 transition-colors hover:bg-indigo-100"
                                    title="Click to view full JSON"
                                  >
                                    <ArrowsPointingOutIcon className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                                    <span className="truncate">{formatDisplayValue(value)}</span>
                                  </button>
                                ) : (
                                  <span className="block max-w-xs truncate" title={formatDisplayValue(value)}>
                                    {formatDisplayValue(value)}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => setDeleteItemTarget(item)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete item"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Delete item confirmation */}
      {deleteItemTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteItemTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete item?</h3>
            <pre className="text-xs bg-gray-50 rounded p-3 mb-4 overflow-auto max-h-32 text-gray-700">{JSON.stringify(deleteItemTarget, null, 2)}</pre>
            <div className="flex space-x-3">
              <button onClick={handleDeleteItem} disabled={deleteLoading} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteItemTarget(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {jsonViewerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">JSON Viewer</h2>
                <p className="text-xs text-gray-500">{selectedJsonTitle}</p>
              </div>
              <button
                onClick={() => setJsonViewerOpen(false)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <ThemeableCodeBlock
                code={JSON.stringify(selectedJsonData, null, 2)}
                language="javascript"
              />
            </div>
          </div>
        </div>
      )}

      <DynamoDBConfigModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />

      {showAddItem && selectedTable && (
        <DynamoDBAddItemModal
          isOpen={showAddItem}
          onClose={() => setShowAddItem(false)}
          tableName={selectedTable}
          projectName={projectName}
          onSubmit={async (item) => {
            try {
              const res = await fetch(`/api/dynamodb/table/${encodeURIComponent(selectedTable)}/item`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item, projectName }),
              });
              const result = await res.json();
              if (result.success) {
                toast.success("Item added");
                setShowAddItem(false);
                loadItems(selectedTable);
              } else {
                toast.error(result.error || "Failed to add item");
              }
            } catch {
              toast.error("Failed to add item");
            }
          }}
        />
      )}

    </div>
  );
}
