"use client";

import {
  addDynamoDBItem,
  deleteDynamoDBItem,
  getDynamoDBTableSchema,
  resourceApi,
} from "@/services/api";
import { DynamoDBTableConfig } from "@/types";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import DynamoDBAddItemModal from "./DynamoDBAddItemModal";
import DynamoDBCompoundKeyCell from "./DynamoDBCompoundKeyCell";
import DynamoDBConfigModal from "./DynamoDBConfigModal";
import DynamoDBItemDetailPanel from "./DynamoDBItemDetailPanel";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import ThemeableCodeBlock from "./ThemeableCodeBlock";
import { parseDynamoDBItem } from "@/lib/dynamodbValue";
import { Button, IconButton, Input, SegmentedControl } from "./ui";

interface DynamoDBViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  selectedTableName?: string;
  pkName?: string;
  skName?: string;
}

interface DynamoDBItem {
  [key: string]: unknown;
}

interface ScanResult {
  items: DynamoDBItem[];
  count: number;
  scannedCount: number;
  lastEvaluatedKey?: unknown;
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

export default function DynamoDBViewer({
  isOpen,
  onClose,
  projectName,
  selectedTableName,
}: DynamoDBViewerProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null);
  const [items, setItems] = useState<DynamoDBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [queryMode, setQueryMode] = useState<"scan" | "query">("scan");
  const [queryParams, setQueryParams] = useState({
    partitionKey: "",
    partitionValue: "",
    sortKey: "",
    sortValue: "",
    limit: "100",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [selectedJsonData, setSelectedJsonData] = useState<unknown>(null);
  const [selectedJsonTitle, setSelectedJsonTitle] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DynamoDBItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const handleCreateTable = async (dynamodbConfig: DynamoDBTableConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "dynamodb", { dynamodbConfig });
      if (response.success) {
        toast.success("DynamoDB table created successfully");
        setShowCreateTableModal(false);
        setTimeout(loadTables, 1000);
      } else {
        toast.error(response.error || "Failed to create DynamoDB table");
      }
    } catch (error) {
      console.error("Create DynamoDB table error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create DynamoDB table");
    } finally {
      setCreateLoading(false);
    }
  };

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${"/api"}/dynamodb/tables?projectName=${encodeURIComponent(
          projectName
        )}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load tables (${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        setTables(data.data || []);
      } else {
        throw new Error(data.error || "Failed to load tables");
      }
    } catch (error) {
      console.error("Failed to load tables:", error);
      setError(error instanceof Error ? error.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen, loadTables]);

  useEffect(() => {
    if (isOpen && selectedTableName && tables.length > 0) {
      setSelectedTable(selectedTableName);
    }
  }, [isOpen, selectedTableName, tables]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTable("");
      setItems([]);
      setTableSchema(null);
      setScanResult(null);
      setError("");
      setSelectedItemIndex(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedItemIndex(null);
  }, [selectedTable]);

  useEffect(() => {
    setSelectedItemIndex((prev) => {
      if (items.length === 0) return null;
      if (prev === null) return 0;
      if (prev >= items.length) return items.length - 1;
      return prev;
    });
  }, [items]);

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

  useEffect(() => {
    if (selectedTable) {
      loadTableSchema();
      loadTableContents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]); // intentionally only re-run when table selection changes

  const refreshData = async () => {
    await loadTables();
    if (selectedTable) {
      await loadTableContents();
    }
  };

  const loadTableSchema = async () => {
    if (!selectedTable) return;
    try {
      const response = await getDynamoDBTableSchema(projectName, selectedTable);
      if (response.success) {
        setTableSchema(response.data);
      }
    } catch (error) {
      console.error("Failed to load table schema:", error);
    }
  };

  const loadTableContents = async () => {
    if (!selectedTable) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${"/api"}/dynamodb/table/${encodeURIComponent(
          selectedTable
        )}/scan?projectName=${encodeURIComponent(projectName)}&limit=${
          queryParams.limit
        }`
      );
      if (!response.ok) {
        throw new Error(`Failed to load table contents (${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        // Parse DynamoDB typed values recursively for display and JSON viewer.
        const items = (data.data.Items || data.data.items || []).map(
          parseDynamoDBItem
        );
        setItems(items);
        setScanResult(data.data);
      } else {
        throw new Error(data.error || "Failed to load table contents");
      }
    } catch (error) {
      console.error("Failed to load table contents:", error);
      setError(error instanceof Error ? error.message : "Failed to load table contents");
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!selectedTable) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectName,
        limit: queryParams.limit,
      });

      if (queryParams.partitionKey && queryParams.partitionValue) {
        params.append("partitionKey", queryParams.partitionKey);
        params.append("partitionValue", queryParams.partitionValue);
      }

      if (queryParams.sortKey && queryParams.sortValue) {
        params.append("sortKey", queryParams.sortKey);
        params.append("sortValue", queryParams.sortValue);
      }

      const response = await fetch(
        `${"/api"}/dynamodb/table/${encodeURIComponent(
          selectedTable
        )}/query?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(`Query failed (${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        // Parse DynamoDB typed values recursively for display and JSON viewer.
        const items = (data.data.Items || data.data.items || []).map(
          parseDynamoDBItem
        );
        setItems(items);
        setScanResult(data.data);
      } else {
        throw new Error(data.error || "Query failed");
      }
    } catch (error) {
      console.error("Failed to execute query:", error);
      setError(error instanceof Error ? error.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item: Record<string, unknown>) => {
    setAddLoading(true);
    setError("");
    try {
      await addDynamoDBItem(projectName, selectedTable, item);
      setAddModalOpen(false);
      await loadTableContents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAddLoading(false);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Helper to get table headers with pk, sk first
  const getTableHeaders = (): string[] => {
    if (items.length === 0) return [];

    // Get all unique keys from items
    const headers = new Set<string>();
    items.forEach((item: DynamoDBItem) => {
      Object.keys(item).forEach((key: string) => headers.add(key));
    });
    const allHeaders = Array.from(headers);

    // If we have schema, prioritize key schema columns
    if (tableSchema) {
      const keyNames = tableSchema.Table.KeySchema.map(
        (key) => key.AttributeName
      );
      const otherHeaders = allHeaders
        .filter((h) => !keyNames.includes(h))
        .sort();
      return [...keyNames, ...otherHeaders];
    }

    // Fallback to old logic if no schema
    const rest = allHeaders.filter((h) => h !== "pk" && h !== "sk").sort();
    return ["pk", "sk", ...rest].filter((h) => allHeaders.includes(h));
  };

  const isKeyColumn = (columnName: string): boolean => {
    if (!tableSchema) return columnName === "pk" || columnName === "sk";
    return tableSchema.Table.KeySchema.some(
      (key) => key.AttributeName === columnName
    );
  };

  const getKeyType = (columnName: string): string => {
    if (!tableSchema) return "";
    const key = tableSchema.Table.KeySchema.find(
      (k) => k.AttributeName === columnName
    );
    return key ? (key.KeyType === "HASH" ? "Partition Key" : "Sort Key") : "";
  };

  const getKeyColumnNames = (): string[] => {
    if (tableSchema) {
      return tableSchema.Table.KeySchema.map((key) => key.AttributeName);
    }
    return getTableHeaders().filter((header) => header === "pk" || header === "sk");
  };

  const renderCellValue = (header: string, value: unknown) => {
    if (isKeyColumn(header) && (typeof value === "string" || typeof value === "number")) {
      return <DynamoDBCompoundKeyCell value={String(value)} />;
    }

    if (typeof value === "object" && value !== null) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleJsonClick(value, `${header} - ${selectedTable}`);
          }}
          className="mx-auto flex max-w-[200px] cursor-pointer items-center justify-center gap-1.5 rounded border border-primary bg-primary-soft px-2 py-1 text-left font-mono text-xs text-ink transition-colors hover:bg-primary/10"
          title="Click to view full JSON"
        >
          <Icon icon="lucide:maximize-2" width={13} className="shrink-0 text-primary" />
          <span className="truncate">{formatValue(value)}</span>
        </button>
      );
    }

    return (
      <span className="mx-auto block max-w-[220px] truncate text-center text-ink-2" title={formatValue(value)}>
        {formatValue(value)}
      </span>
    );
  };

  const selectedItem =
    selectedItemIndex !== null && items[selectedItemIndex] ? items[selectedItemIndex] : null;

  const handleJsonClick = (data: unknown, title: string) => {
    setSelectedJsonData(data);
    setSelectedJsonTitle(title);
    setJsonViewerOpen(true);
  };

  const handleDeleteClick = (item: DynamoDBItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !selectedTable || !tableSchema) return;

    setDeleteLoading(true);
    setError("");

    try {
      // Get the key schema to identify partition and sort keys
      const keySchema = tableSchema.Table.KeySchema;
      const partitionKey = keySchema.find(
        (key) => key.KeyType === "HASH"
      )?.AttributeName;
      const sortKey = keySchema.find(
        (key) => key.KeyType === "RANGE"
      )?.AttributeName;

      if (!partitionKey || !itemToDelete[partitionKey]) {
        throw new Error("Partition key not found in item");
      }

      await deleteDynamoDBItem(
        projectName,
        selectedTable,
        partitionKey,
        String(itemToDelete[partitionKey]),
        sortKey,
        sortKey && itemToDelete[sortKey]
          ? String(itemToDelete[sortKey])
          : undefined
      );

      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadTableContents(); // Refresh the table
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return <></>;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
  <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
        className="flex h-[88vh] w-full max-w-7xl flex-col rounded-xl border border-border bg-surface shadow-e3"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <Icon icon="logos:aws-dynamodb" width={18} />
            <div>
              <h2 className="text-[15px] font-semibold text-ink">DynamoDB tables</h2>
              <p className="text-[11px] text-muted">View and manage table contents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setShowCreateTableModal(true)}>
              Create table
            </Button>
            <Link
              href="/manage/dynamodb"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
            >
              Open manager
              <Icon icon="lucide:external-link" width={13} />
            </Link>
            <IconButton icon="lucide:x" variant="ghost" label="Close" onClick={onClose} />
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
          {/* Table Selection */}
          <div className="flex shrink-0 items-center gap-2.5">
            <label className="whitespace-nowrap text-xs font-medium text-ink-2">Table</label>
            <div className="relative">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                disabled={loading}
                className="h-8 min-w-[200px] cursor-pointer appearance-none rounded-lg border border-border-strong bg-surface pl-2.5 pr-8 font-mono text-[13px] text-ink outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Choose a table…</option>
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
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
              label="Refresh"
              onClick={refreshData}
              disabled={loading}
              className={loading ? "[&_svg]:animate-spin" : ""}
            />
          </div>

          {/* Below-selector area — switches between initial loading / empty / table content */}
          <AnimatePresence mode="wait">

          {loading && tables.length === 0 ? (
            /* Initial skeleton while tables are loading */
            <motion.div
              key="initial-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-h-0 flex-1 animate-pulse overflow-hidden rounded-xl border border-border"
            >
              {/* Fake table header */}
              <div className="flex gap-6 border-b border-divider bg-surface-2 px-3 py-2">
                {[40, 28, 20, 12].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-skeleton" style={{ width: `${w}%` }} />
                ))}
              </div>
              {/* Fake rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 border-b border-divider px-3 py-3"
                  style={{ opacity: 1 - i * 0.09 }}
                >
                  {[40, 28, 20, 12].map((w, j) => (
                    <div key={j} className="h-3 rounded bg-skeleton" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ))}
            </motion.div>

          ) : !loading && tables.length === 0 ? (
            /* Empty state */
            <motion.div
              key="empty-tables"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
              className="flex flex-1 flex-col items-center justify-center text-center"
            >
              <Icon icon="logos:aws-dynamodb" className="mb-4 h-20 w-20 opacity-20" />
              <p className="mb-1 text-sm font-medium text-ink-2">No DynamoDB tables found</p>
              <p className="mb-5 text-xs text-faint">Create your first table to start storing data.</p>
              <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setShowCreateTableModal(true)}>
                Create table
              </Button>
            </motion.div>

          ) : tables.length > 0 && (
          <motion.div
            key="table-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >

          {selectedTable && (
            <>
              {/* Query Controls */}
              <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-e1">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Read mode</span>
                    <SegmentedControl
                      value={queryMode}
                      onChange={setQueryMode}
                      options={[
                        { value: "scan", label: "Scan" },
                        { value: "query", label: "Query" },
                      ]}
                    />
                  </div>

                  {queryMode === "query" && (
                    <>
                      <label className="flex min-w-[110px] flex-1 flex-col gap-1.5">
                        <span className="text-xs font-medium text-ink-2">Partition key</span>
                        <Input
                          mono
                          value={queryParams.partitionKey}
                          onChange={(e) => setQueryParams({ ...queryParams, partitionKey: e.target.value })}
                          placeholder="pk"
                        />
                      </label>
                      <label className="flex min-w-[130px] flex-1 flex-col gap-1.5">
                        <span className="text-xs font-medium text-ink-2">Value</span>
                        <Input
                          mono
                          value={queryParams.partitionValue}
                          onChange={(e) => setQueryParams({ ...queryParams, partitionValue: e.target.value })}
                          placeholder="value"
                        />
                      </label>
                      <label className="flex min-w-[100px] flex-1 flex-col gap-1.5">
                        <span className="text-xs font-medium text-ink-2">Sort key</span>
                        <Input
                          mono
                          value={queryParams.sortKey}
                          onChange={(e) => setQueryParams({ ...queryParams, sortKey: e.target.value })}
                          placeholder="sk"
                        />
                      </label>
                      <label className="flex min-w-[100px] flex-1 flex-col gap-1.5">
                        <span className="text-xs font-medium text-ink-2">Sort value</span>
                        <Input
                          mono
                          value={queryParams.sortValue}
                          onChange={(e) => setQueryParams({ ...queryParams, sortValue: e.target.value })}
                          placeholder="value"
                        />
                      </label>
                    </>
                  )}

                  <label className="flex w-[84px] flex-col gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Limit</span>
                    <Input
                      mono
                      type="number"
                      min="1"
                      max="1000"
                      value={queryParams.limit}
                      onChange={(e) => setQueryParams({ ...queryParams, limit: e.target.value })}
                    />
                  </label>

                  <Button
                    variant="primary"
                    icon="lucide:play"
                    loading={loading}
                    onClick={queryMode === "scan" ? loadTableContents : executeQuery}
                  >
                    {loading ? "Loading…" : queryMode === "scan" ? "Scan table" : "Execute query"}
                  </Button>
                </div>

                {scanResult && (
                  <div className="flex items-center gap-2 border-t border-divider pt-2.5 text-[11px] text-muted">
                    <span>
                      Showing <strong className="text-ink-2">{items.length} items</strong> · scanned{" "}
                      {scanResult.scannedCount}
                    </span>
                    <span className="ml-auto font-mono">{selectedTable}</span>
                  </div>
                )}
              </div>

              {/* Add Item Button */}
              <div className="flex shrink-0 items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">Items</h3>
                <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setAddModalOpen(true)}>
                  Add item
                </Button>
              </div>

              {/* Items Table + Detail Panel */}
              <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedTable}-${loading ? "loading" : "loaded"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex min-h-0 flex-1 gap-4"
              >
                <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-surface shadow-e1">
                {loading ? (
                  /* Skeleton rows that match the real table layout */
                  <div className="animate-pulse">
                    <div className="flex gap-4 border-b border-divider bg-surface-2 px-3 py-2">
                      {[35, 25, 20, 15].map((w, i) => (
                        <div key={i} className="h-3 rounded bg-skeleton" style={{ width: `${w}%` }} />
                      ))}
                      <div className="ml-auto h-3 w-10 rounded bg-skeleton" />
                    </div>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 border-b border-divider px-3 py-3" style={{ opacity: 1 - i * 0.12 }}>
                        {[35, 25, 20, 15].map((w, j) => (
                          <div key={j} className="h-3 rounded bg-skeleton" style={{ width: `${w}%` }} />
                        ))}
                        <div className="ml-auto h-5 w-5 rounded bg-skeleton" />
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <Icon icon="logos:aws-dynamodb" className="mb-4 h-20 w-20 opacity-20" />
                    <p className="mb-1 text-sm font-medium text-ink-2">No items found</p>
                    <p className="mb-5 text-xs text-faint">Add your first item to this table.</p>
                    <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setAddModalOpen(true)}>
                      Add item
                    </Button>
                  </div>
                ) : (
                  <table className="w-full table-auto border-collapse">
                    <thead className="sticky top-0 z-1 bg-surface-2">
                      <tr>
                        {getTableHeaders().map((header, hi) => (
                          <th
                            key={`${selectedTable}-header-${header}-${hi}`}
                            className={`whitespace-nowrap border-b border-divider px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                              isKeyColumn(header)
                                ? "min-w-[200px] bg-primary-soft text-left text-primary-ink"
                                : "text-center text-faint"
                            }`}
                          >
                            <span>{header}</span>
                            {isKeyColumn(header) && (
                              <span className="ml-1.5 text-[10px] font-normal normal-case text-primary">
                                ({getKeyType(header)})
                              </span>
                            )}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-faint w-14">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={`${selectedTable}-row-${index}`}
                          onClick={() => setSelectedItemIndex(index)}
                          className={`cursor-pointer border-b border-divider transition-colors last:border-b-0 hover:bg-surface-2 ${
                            selectedItemIndex === index ? "bg-primary-soft" : ""
                          }`}
                        >
                          {getTableHeaders().map((header, hj) => (
                            <td
                              key={`${header}-${hj}`}
                              className={`px-3 py-2 text-sm ${
                                isKeyColumn(header)
                                  ? "min-w-[200px] max-w-[240px] bg-primary-soft/60 text-left align-top font-medium"
                                  : "text-center align-middle"
                              }`}
                            >
                              {renderCellValue(header, item[header])}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center">
                            <IconButton
                              icon="lucide:trash-2"
                              variant="ghost"
                              size="sm"
                              label="Delete item"
                              className="!text-danger hover:!bg-danger-soft hover:!text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(item);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                </div>

                {selectedItem ? (
                  <DynamoDBItemDetailPanel
                    item={selectedItem}
                    tableName={selectedTable}
                    keyColumnNames={getKeyColumnNames()}
                    getKeyType={getKeyType}
                    onDelete={() => handleDeleteClick(selectedItem)}
                    onClose={() => setSelectedItemIndex(null)}
                    onJsonClick={handleJsonClick}
                  />
                ) : null}
              </motion.div>
              </AnimatePresence>
            </>
          )}
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>

    <DynamoDBAddItemModal
      isOpen={addModalOpen}
      onClose={() => setAddModalOpen(false)}
      onSubmit={handleAddItem}
      tableName={selectedTable}
      projectName={projectName}
      loading={addLoading}
    />

    {/* Delete Confirmation Modal */}
    {deleteModalOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-scrim p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-e3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-divider px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Delete item</h2>
              <p className="text-[11px] text-muted">This action cannot be undone</p>
            </div>
            <IconButton icon="lucide:x" variant="ghost" label="Close" onClick={() => setDeleteModalOpen(false)} />
          </div>

          {/* Content */}
          <div className="p-5">
            <p className="mb-4 text-sm text-ink-2">The item will be permanently deleted from the table.</p>

            {error && (
              <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3 py-2.5 text-sm text-danger-ink">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="danger" icon="lucide:trash-2" loading={deleteLoading} onClick={handleDeleteConfirm}>
                {deleteLoading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* JSON Viewer Modal */}
    {jsonViewerOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-scrim p-4">
        <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-e3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-divider px-5 py-4 shrink-0">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">JSON viewer</h2>
              <p className="text-[11px] text-muted">{selectedJsonTitle}</p>
            </div>
            <IconButton icon="lucide:x" variant="ghost" label="Close" onClick={() => setJsonViewerOpen(false)} />
          </div>

          {/* JSON Content */}
          <div className="flex-1 overflow-auto p-5">
            <ThemeableCodeBlock
              code={JSON.stringify(selectedJsonData, null, 2)}
              language="javascript"
            />
          </div>
        </div>
      </div>
    )}

    {/* Create Table Modal */}
    <DynamoDBConfigModal
      isOpen={showCreateTableModal}
      onClose={() => setShowCreateTableModal(false)}
      onSubmit={handleCreateTable}
      projectName={projectName}
      loading={createLoading}
    />
  </>
  );
}
