"use client";

import {
  addDynamoDBItem,
  deleteDynamoDBItem,
  getDynamoDBTableSchema,
} from "@/services/api";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import DynamoDBAddItemModal from "./DynamoDBAddItemModal";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              DynamoDB Tables
            </h2>
            <p className="text-sm text-gray-600">
              View and manage DynamoDB table contents
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
          {/* Table Selection */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <label className="text-sm font-medium text-gray-700">
              Select Table:
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={loading}
            >
              <option value="">Choose a table...</option>
              {tables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {selectedTable && (
            <>
              {/* Query Controls */}
              <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0">
                <div className="flex items-center space-x-4 mb-4">
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

                <div className="flex items-center space-x-4 mt-4">
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
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      min="1"
                      max="1000"
                    />
                  </div>
                  <button
                    onClick={
                      queryMode === "scan" ? loadTableContents : executeQuery
                    }
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    {loading
                      ? "Loading..."
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
                <h3 className="text-lg font-semibold">Items</h3>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setAddModalOpen(true)}
                >
                  Add Item
                </button>
              </div>

              {/* Items Table */}
              <div className="flex-1 overflow-hidden">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? "Loading items..." : "No items found"}
                  </div>
                ) : (
                  <div className="h-full overflow-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-1">
                        <tr>
                          {getTableHeaders().map((header) => (
                            <th
                              key={header}
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isKeyColumn(header)
                                  ? "bg-blue-100 text-blue-800 border-r border-blue-200"
                                  : "text-gray-500"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span>{header}</span>
                                {isKeyColumn(header) && (
                                  <span className="text-xs font-normal text-blue-600 mt-1">
                                    {getKeyType(header)}
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-20">
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
                                className={`px-6 py-4 text-sm ${
                                  isKeyColumn(header)
                                    ? "bg-blue-50 text-blue-900 border-r border-blue-200 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                <div
                                  className={`${
                                    typeof item[header] === "object" &&
                                    item[header] !== null
                                      ? "max-w-md overflow-auto"
                                      : "max-w-xs truncate"
                                  }`}
                                  title={
                                    typeof item[header] === "object" &&
                                    item[header] !== null
                                      ? "Click to view full JSON"
                                      : formatValue(item[header])
                                  }
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
                                      className="w-full text-left text-xs bg-blue-50 hover:bg-blue-100 p-2 rounded border border-blue-200 font-mono text-gray-800 transition-colors cursor-pointer"
                                    >
                                      <div className="truncate">
                                        {formatValue(item[header])}
                                      </div>
                                      <div className="flex justify-center mt-1">
                                        <PlusIcon className="h-4 w-4 text-blue-600" />
                                      </div>
                                    </button>
                                  ) : (
                                    formatValue(item[header])
                                  )}
                                </div>
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center">
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
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete Item</h2>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this item?
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-sm text-gray-700 mb-4">
                <p>
                  This action cannot be undone. The item will be permanently
                  deleted from the table.
                </p>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">JSON Viewer</h2>
                <p className="text-sm text-gray-600">{selectedJsonTitle}</p>
              </div>
              <button
                onClick={() => setJsonViewerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
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
    </div>
  );
}
