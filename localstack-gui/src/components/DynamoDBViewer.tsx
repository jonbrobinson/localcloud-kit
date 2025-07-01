"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { localstackApi } from "@/services/api";

interface DynamoDBViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

interface DynamoDBItem {
  [key: string]: any;
}

interface ScanResult {
  items: DynamoDBItem[];
  count: number;
  scannedCount: number;
  lastEvaluatedKey?: any;
}

export default function DynamoDBViewer({
  isOpen,
  onClose,
  projectName,
}: DynamoDBViewerProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
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

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTable) {
      loadTableContents();
    }
  }, [selectedTable]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3031"
        }/dynamodb/tables?projectName=${encodeURIComponent(projectName)}`
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

  const loadTableContents = async () => {
    if (!selectedTable) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3031"
        }/dynamodb/table/${encodeURIComponent(
          selectedTable
        )}/scan?projectName=${encodeURIComponent(projectName)}&limit=${
          queryParams.limit
        }`
      );
      const data = await response.json();
      if (data.success) {
        setItems(data.data.items || []);
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
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3031"
        }/dynamodb/table/${encodeURIComponent(
          selectedTable
        )}/query?${params.toString()}`
      );
      const data = await response.json();
      if (data.success) {
        setItems(data.data.items || []);
        setScanResult(data.data);
      }
    } catch (error) {
      console.error("Failed to execute query:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    // TODO: Implement add item functionality
    console.log("Add item functionality to be implemented");
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getTableHeaders = (): string[] => {
    if (items.length === 0) return [];

    const headers = new Set<string>();
    items.forEach((item) => {
      Object.keys(item).forEach((key) => headers.add(key));
    });

    return Array.from(headers).sort();
  };

  if (!isOpen) return null;

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
        <div className="flex-1 flex flex-col p-6 space-y-4">
          {/* Table Selection */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Select Table:
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              onClick={loadTables}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {selectedTable && (
            <>
              {/* Query Controls */}
              <div className="bg-gray-50 rounded-lg p-4">
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
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <button
                    onClick={addItem}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Results Info */}
              {scanResult && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {items.length} items (scanned:{" "}
                    {scanResult.scannedCount})
                  </span>
                  <span>Table: {selectedTable}</span>
                </div>
              )}

              {/* Items Table */}
              <div className="flex-1 overflow-auto">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? "Loading items..." : "No items found"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {getTableHeaders().map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {getTableHeaders().map((header) => (
                              <td
                                key={header}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                <div
                                  className="max-w-xs truncate"
                                  title={formatValue(item[header])}
                                >
                                  {formatValue(item[header])}
                                </div>
                              </td>
                            ))}
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
    </div>
  );
}
