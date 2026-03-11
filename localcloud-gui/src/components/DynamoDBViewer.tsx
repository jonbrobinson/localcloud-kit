"use client";

import {
  addDynamoDBItem,
  deleteDynamoDBItem,
  getDynamoDBTableSchema,
  resourceApi,
} from "@/services/api";
import { DynamoDBTableConfig } from "@/types";
import {
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import DynamoDBAddItemModal from "./DynamoDBAddItemModal";
import DynamoDBConfigModal from "./DynamoDBConfigModal";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

interface DynamoDBViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  selectedTableName?: string;
  pkName?: string;
  skName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DynamoDBItem {
  [key: string]: any;
}

interface ScanResult {
  items: DynamoDBItem[];
  count: number;
  scannedCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastEvaluatedKey?: any;
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
  const [selectedJsonData, setSelectedJsonData] = useState<any>(null);
  const [selectedJsonTitle, setSelectedJsonTitle] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DynamoDBItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (selectedTable) {
      loadTableSchema();
      loadTableContents();
    }
  }, [selectedTable]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${"/api"}/dynamodb/tables?projectName=${encodeURIComponent(
          projectName
        )}`
      );
      const data = await response.json();
      if (data.success) {
        setTables(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load tables:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Helper to flatten DynamoDB item format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flattenDynamoDBItem = (item: any): Record<string, any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flat: Record<string, any> = {};
    for (const key in item) {
      const value = item[key];
      if (typeof value === "object" && value !== null) {
        if ("S" in value) flat[key] = value.S;
        else if ("N" in value) flat[key] = Number(value.N);
        else if ("BOOL" in value) flat[key] = value.BOOL;
        else if ("NULL" in value) flat[key] = null;
        else if ("L" in value) flat[key] = value.L.map(flattenDynamoDBItem);
        else if ("M" in value) flat[key] = flattenDynamoDBItem(value.M);
        else flat[key] = value;
      } else {
        flat[key] = value;
      }
    }
    return flat;
  };

  const loadTableContents = async () => {
    if (!selectedTable) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${"/api"}/dynamodb/table/${encodeURIComponent(
          selectedTable
        )}/scan?projectName=${encodeURIComponent(projectName)}&limit=${
          queryParams.limit
        }`
      );
      const data = await response.json();
      if (data.success) {
        // Flatten DynamoDB items for display
        const items = (data.data.Items || data.data.items || []).map(
          flattenDynamoDBItem
        );
        setItems(items);
        setScanResult(data.data);
      }
    } catch (error) {
      console.error("Failed to load table contents:", error);
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
      const data = await response.json();
      if (data.success) {
        // Flatten DynamoDB items for display
        const items = (data.data.Items || data.data.items || []).map(
          flattenDynamoDBItem
        );
        setItems(items);
        setScanResult(data.data);
      }
    } catch (error) {
      console.error("Failed to execute query:", error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddItem = async (item: any) => {
    setAddLoading(true);
    setError("");
    try {
      await addDynamoDBItem(projectName, selectedTable, item);
      setAddModalOpen(false);
      await loadTableContents();
    } catch (err: any) {
      setError(err.message || "Failed to add item");
    } finally {
      setAddLoading(false);
    }
  };

  const formatValue = (value: any): string => {
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

  const handleJsonClick = (data: any, title: string) => {
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
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return <></>;

  return (
  <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">DynamoDB Tables</h2>
            <p className="text-xs text-gray-500">View and manage table contents</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateTableModal(true)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Create Table
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 gap-4 min-h-0">
          {/* Table Selection */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Select Table
            </label>
            <div className="relative">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <option value="">Choose a table…</option>
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
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
              className="flex-1 min-h-0 overflow-hidden border border-gray-200 rounded-lg animate-pulse"
            >
              {/* Fake table header */}
              <div className="flex bg-gray-50 border-b border-gray-200 px-3 py-2 gap-6">
                {[40, 28, 20, 12].map((w, i) => (
                  <div key={i} className={`h-3 bg-gray-200 rounded`} style={{ width: `${w}%` }} />
                ))}
              </div>
              {/* Fake rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center border-b border-gray-100 px-3 py-3 gap-6"
                  style={{ opacity: 1 - i * 0.09 }}
                >
                  {[40, 28, 20, 12].map((w, j) => (
                    <div key={j} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
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
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <Icon icon="logos:aws-dynamodb" className="w-20 h-20 mb-4 opacity-20" />
              <p className="text-sm font-medium text-gray-700 mb-1">No DynamoDB tables found</p>
              <p className="text-xs text-gray-400 mb-5">Create your first table to start storing data.</p>
              <button
                onClick={() => setShowCreateTableModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Create Table
              </button>
            </motion.div>

          ) : tables.length > 0 && (
          <motion.div
            key="table-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col gap-4 min-h-0"
          >

          {selectedTable && (
            <>
              {/* Query Controls */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex-shrink-0">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="scan"
                      name="queryMode"
                      value="scan"
                      checked={queryMode === "scan"}
                      onChange={(e) =>
                        setQueryMode(e.target.value as "scan" | "query")
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="scan"
                      className="text-sm font-medium text-gray-700"
                    >
                      Scan
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="query"
                      name="queryMode"
                      value="query"
                      checked={queryMode === "query"}
                      onChange={(e) =>
                        setQueryMode(e.target.value as "scan" | "query")
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="query"
                      className="text-sm font-medium text-gray-700"
                    >
                      Query
                    </label>
                  </div>
                </div>

                {queryMode === "query" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Partition Key
                      </label>
                      <input
                        type="text"
                        value={queryParams.partitionKey}
                        onChange={(e) =>
                          setQueryParams({
                            ...queryParams,
                            partitionKey: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="pk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Partition Value
                      </label>
                      <input
                        type="text"
                        value={queryParams.partitionValue}
                        onChange={(e) =>
                          setQueryParams({
                            ...queryParams,
                            partitionValue: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Key (optional)
                      </label>
                      <input
                        type="text"
                        value={queryParams.sortKey}
                        onChange={(e) =>
                          setQueryParams({
                            ...queryParams,
                            sortKey: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="sk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Value (optional)
                      </label>
                      <input
                        type="text"
                        value={queryParams.sortValue}
                        onChange={(e) =>
                          setQueryParams({
                            ...queryParams,
                            sortValue: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="value"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      Limit:
                    </label>
                    <input
                      type="number"
                      value={queryParams.limit}
                      onChange={(e) =>
                        setQueryParams({
                          ...queryParams,
                          limit: e.target.value,
                        })
                      }
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      min="1"
                      max="1000"
                    />
                  </div>
                  <button
                    onClick={
                      queryMode === "scan" ? loadTableContents : executeQuery
                    }
                    disabled={loading}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" />
                    {loading
                      ? "Loading…"
                      : queryMode === "scan"
                      ? "Scan Table"
                      : "Execute Query"}
                  </button>
                </div>
              </div>

              {/* Results Info */}
              {scanResult && (
                <div className="flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
                  <span>
                    Showing {items.length} items (scanned:{" "}
                    {scanResult.scannedCount})
                  </span>
                  <span>Table: {selectedTable}</span>
                </div>
              )}

              {/* Add Item Button */}
              <div className="flex justify-between items-center flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Items</h3>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add Item
                </button>
              </div>

              {/* Items Table */}
              <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedTable}-${loading ? "loading" : "loaded"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex-1 min-h-0 overflow-auto border border-gray-200 rounded-lg pb-4"
              >
                {loading ? (
                  /* Skeleton rows that match the real table layout */
                  <div className="animate-pulse">
                    <div className="flex bg-gray-50 border-b border-gray-200 px-3 py-2 gap-4">
                      {[35, 25, 20, 15].map((w, i) => (
                        <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: `${w}%` }} />
                      ))}
                      <div className="h-3 w-10 bg-gray-100 rounded ml-auto" />
                    </div>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center border-b border-gray-100 px-3 py-3 gap-4" style={{ opacity: 1 - i * 0.12 }}>
                        {[35, 25, 20, 15].map((w, j) => (
                          <div key={j} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
                        ))}
                        <div className="h-5 w-5 bg-gray-100 rounded ml-auto" />
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <Icon icon="logos:aws-dynamodb" className="w-20 h-20 mb-4 opacity-20" />
                    <p className="text-sm font-medium text-gray-700 mb-1">No items found</p>
                    <p className="text-xs text-gray-400 mb-5">Add your first item to this table.</p>
                    <button
                      onClick={() => setAddModalOpen(true)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Item
                    </button>
                  </div>
                ) : (
                  <>
                    <table className="w-full divide-y divide-gray-200 table-auto">
                      <thead className="bg-gray-50 sticky top-0 z-1">
                        <tr>
                          {getTableHeaders().map((header) => (
                            <th
                              key={header}
                              className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                                isKeyColumn(header)
                                  ? "bg-blue-100 text-blue-800 border-r border-blue-200"
                                  : "text-gray-500"
                              }`}
                            >
                              <span>{header}</span>
                              {isKeyColumn(header) && (
                                <span className="ml-1.5 text-xs font-normal text-blue-500 normal-case">
                                  ({getKeyType(header)})
                                </span>
                              )}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-14">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {getTableHeaders().map((header) => (
                              <td
                                key={header}
                                className={`px-3 py-2 text-sm ${
                                  isKeyColumn(header)
                                    ? "bg-blue-50 text-blue-900 border-r border-blue-200 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                {typeof item[header] === "object" &&
                                item[header] !== null ? (
                                  <button
                                    onClick={() =>
                                      handleJsonClick(
                                        item[header],
                                        `${header} - ${selectedTable}`
                                      )
                                    }
                                    className="flex items-center gap-1.5 text-left text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 font-mono text-gray-800 transition-colors cursor-pointer max-w-[200px]"
                                    title="Click to view full JSON"
                                  >
                                    <ArrowsPointingOutIcon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                    <span className="truncate">
                                      {formatValue(item[header])}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="block max-w-[220px] truncate" title={formatValue(item[header])}>
                                    {formatValue(item[header])}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleDeleteClick(item)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete item"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Item</h2>
              <p className="text-xs text-gray-500">This action cannot be undone</p>
            </div>
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-sm text-gray-700 mb-4">
              <p>The item will be permanently deleted from the table.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* JSON Viewer Modal */}
    {jsonViewerOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">JSON Viewer</h2>
              <p className="text-xs text-gray-500">{selectedJsonTitle}</p>
            </div>
            <button
              onClick={() => setJsonViewerOpen(false)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* JSON Content */}
          <div className="flex-1 p-6 overflow-auto">
            <pre className="text-sm font-mono text-gray-800 bg-gray-50 p-4 rounded border overflow-auto h-full whitespace-pre-wrap">
              {JSON.stringify(selectedJsonData, null, 2)}
            </pre>
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
