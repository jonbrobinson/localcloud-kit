"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import { resourceApi } from "@/services/api";
import AppNavBar from "@/components/AppNavBar";
import { DynamoDBTableConfig } from "@/types";
import DynamoDBConfigModal from "@/components/DynamoDBConfigModal";
import DynamoDBAddItemModal from "@/components/DynamoDBAddItemModal";
import DynamoDBCompoundKeyCell from "@/components/DynamoDBCompoundKeyCell";
import DynamoDBItemDetailPanel from "@/components/DynamoDBItemDetailPanel";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { parseDynamoDBItem } from "@/lib/dynamodbValue";
import { Button, IconButton } from "@/components/ui";

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
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

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
    setSelectedItemIndex(null);
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

  useEffect(() => {
    setSelectedItemIndex((prev) => {
      if (items.length === 0) return null;
      if (prev === null) return 0;
      if (prev >= items.length) return items.length - 1;
      return prev;
    });
  }, [items]);

  const getOrderedKeys = (): string[] => {
    if (items.length === 0) return [];
    const all = Array.from(new Set(items.flatMap(Object.keys)));
    if (schema) {
      const keyNames = [schema.pk, schema.sk].filter(
        (name): name is string => typeof name === "string" && all.includes(name)
      );
      const rest = all.filter((name) => !keyNames.includes(name)).sort();
      return [...keyNames, ...rest];
    }
    return all.sort();
  };

  const isKeyColumn = (columnName: string): boolean =>
    schema?.pk === columnName || schema?.sk === columnName;

  const getKeyType = (columnName: string): string => {
    if (schema?.pk === columnName) return "Partition Key";
    if (schema?.sk === columnName) return "Sort Key";
    return "";
  };

  const getKeyColumnNames = (): string[] => {
    if (!schema) return [];
    return [schema.pk, schema.sk].filter((name): name is string => typeof name === "string");
  };

  const renderCellValue = (columnName: string, value: unknown) => {
    if (isKeyColumn(columnName) && (typeof value === "string" || typeof value === "number")) {
      return <DynamoDBCompoundKeyCell value={String(value)} />;
    }

    const isComplexValue = value !== null && typeof value === "object";
    if (isComplexValue) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleJsonClick(value, `${columnName} - ${selectedTable}`);
          }}
          className="mx-auto flex max-w-xs cursor-pointer items-center justify-center gap-1.5 rounded border border-primary bg-primary-soft px-2 py-1 text-left font-mono text-xs text-ink transition-colors hover:bg-primary/10"
          title="Click to view full JSON"
        >
          <Icon icon="lucide:maximize-2" width={13} className="shrink-0 text-primary" />
          <span className="truncate">{formatDisplayValue(value)}</span>
        </button>
      );
    }

    return (
      <span className="mx-auto block max-w-xs truncate text-center font-mono text-xs text-ink-2" title={formatDisplayValue(value)}>
        {formatDisplayValue(value)}
      </span>
    );
  };

  const orderedKeys = getOrderedKeys();
  const selectedItem =
    selectedItemIndex !== null && items[selectedItemIndex] ? items[selectedItemIndex] : null;

  const handleJsonClick = (data: unknown, title: string) => {
    setSelectedJsonData(data);
    setSelectedJsonTitle(title);
    setJsonViewerOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppNavBar pageLabel="Manage DynamoDB">
            <Link
              href="/dynamodb"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-ink-2 bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
            >
              <Icon icon="lucide:book-open" width={15} />
              Docs
            </Link>

            <div className="relative">
              <select
                value={selectedTable ?? ""}
                onChange={(e) => {
                  if (e.target.value) void selectTable(e.target.value);
                }}
                disabled={loadingTables}
                className="h-8 min-w-[180px] cursor-pointer appearance-none rounded-lg border border-border-strong bg-surface pl-2.5 pr-8 font-mono text-[13px] text-ink outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{loadingTables ? "Loading…" : "Choose a table…"}</option>
                {tables.map((t) => (
                  <option key={t.TableName} value={t.TableName}>
                    {t.TableName}
                  </option>
                ))}
              </select>
              <Icon
                icon="lucide:chevron-down"
                width={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint"
              />
            </div>
            <IconButton
              icon="lucide:refresh-cw"
              variant="outline"
              label="Refresh tables and items"
              disabled={loadingTables || loadingItems}
              className={loadingTables || loadingItems ? "[&_svg]:animate-spin" : ""}
              onClick={() => {
                void loadTables();
                if (selectedTable) void loadItems(selectedTable);
              }}
            />
            <Button variant="secondary" size="sm" icon="lucide:plus" onClick={() => setShowCreate(true)}>
              New table
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="lucide:plus"
              disabled={!selectedTable}
              onClick={() => setShowAddItem(true)}
            >
              Add item
            </Button>
      </AppNavBar>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-4 p-6">
        {!selectedTable ? (
          <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            {loadingTables ? (
              <>
                <Icon icon="lucide:loader-2" width={40} className="mb-4 animate-spin text-faint" />
                <p className="text-sm text-muted">Loading tables…</p>
              </>
            ) : tables.length === 0 ? (
              <>
                <Icon icon="logos:aws-dynamodb" width={64} height={64} className="mb-4 opacity-20" />
                <p className="mb-1 text-sm font-medium text-ink-2">No DynamoDB tables yet</p>
                <p className="mb-5 text-xs text-faint">Create your first table to start storing data.</p>
                <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setShowCreate(true)}>
                  Create table
                </Button>
              </>
            ) : (
              <>
                <Icon icon="logos:aws-dynamodb" width={64} height={64} className="mb-4 opacity-20" />
                <p className="text-sm text-muted">Select a table above to view and manage its items</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span>
                Showing <strong className="text-ink-2">{items.length} items</strong>
              </span>
              {schema && (
                <span className="font-mono">
                  · pk: {schema.pk}
                  {schema.sk ? ` / sk: ${schema.sk}` : ""}
                </span>
              )}
            </div>

            {loadingItems ? (
              <div className="flex-1 animate-pulse space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-skeleton" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-border bg-surface py-16 text-center shadow-e1">
                <Icon icon="lucide:search" width={40} className="mb-3 text-faint" />
                <p className="mb-3 text-sm text-muted">No items in this table</p>
                <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setShowAddItem(true)}>
                  Add first item
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[28rem] flex-1 gap-4">
                <div className="min-w-0 flex-1 overflow-hidden overflow-x-auto rounded-xl border border-border bg-surface shadow-e1">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="border-b border-divider bg-surface-2">
                      <tr>
                        {orderedKeys.map((k) => (
                          <th
                            key={k}
                            className={`whitespace-nowrap px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${
                              isKeyColumn(k) ? "min-w-[200px] bg-primary-soft text-left text-primary-ink" : "text-center text-faint"
                            }`}
                          >
                            <span>{k}</span>
                            {isKeyColumn(k) ? (
                              <span className="ml-1.5 text-[10px] font-normal normal-case text-primary">
                                ({getKeyType(k)})
                              </span>
                            ) : null}
                          </th>
                        ))}
                        <th className="px-3.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-faint">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr
                          key={i}
                          onClick={() => setSelectedItemIndex(i)}
                          className={`cursor-pointer border-b border-divider transition-colors last:border-b-0 hover:bg-surface-2 ${
                            selectedItemIndex === i ? "bg-primary-soft" : ""
                          }`}
                        >
                          {orderedKeys.map((k) => (
                            <td
                              key={k}
                              className={`px-3.5 py-2.5 ${
                                isKeyColumn(k)
                                  ? "min-w-[200px] max-w-[240px] bg-primary-soft/60 text-left align-top"
                                  : "text-center align-middle"
                              }`}
                            >
                              {renderCellValue(k, item[k])}
                            </td>
                          ))}
                          <td className="px-3.5 py-2.5 text-right">
                            <IconButton
                              icon="lucide:trash-2"
                              variant="ghost"
                              size="sm"
                              label="Delete item"
                              className="!text-danger hover:!bg-danger-soft hover:!text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteItemTarget(item);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-2 border-t border-border bg-surface-2 px-3.5 py-2.5">
                    <span className="text-[11px] text-muted">
                      Wide attributes truncate — open an item for the full document
                    </span>
                  </div>
                </div>

                {selectedItem && selectedTable ? (
                  <DynamoDBItemDetailPanel
                    item={selectedItem}
                    tableName={selectedTable}
                    keyColumnNames={getKeyColumnNames()}
                    getKeyType={getKeyType}
                    onDelete={() => setDeleteItemTarget(selectedItem)}
                    onClose={() => setSelectedItemIndex(null)}
                    onJsonClick={handleJsonClick}
                  />
                ) : null}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete item confirmation */}
      {deleteItemTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
          onClick={() => setDeleteItemTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-e3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-[15px] font-semibold text-ink">Delete item?</h3>
            <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink-2">
              {JSON.stringify(deleteItemTarget, null, 2)}
            </pre>
            <div className="flex gap-2.5">
              <Button
                variant="danger"
                icon="lucide:trash-2"
                loading={deleteLoading}
                onClick={handleDeleteItem}
                className="flex-1 justify-center"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeleteItemTarget(null)}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {jsonViewerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-scrim p-4">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-e3">
            <div className="flex shrink-0 items-center justify-between border-b border-divider px-6 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">JSON viewer</h2>
                <p className="text-[11px] text-muted">{selectedJsonTitle}</p>
              </div>
              <IconButton icon="lucide:x" variant="ghost" label="Close" onClick={() => setJsonViewerOpen(false)} />
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
