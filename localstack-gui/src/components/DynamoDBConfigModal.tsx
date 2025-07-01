"use client";

import { useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DynamoDBTableConfig, DynamoDBGSI } from "@/types";

interface DynamoDBConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: DynamoDBTableConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function DynamoDBConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: DynamoDBConfigModalProps) {
  const [tableName, setTableName] = useState(`${projectName}-table`);
  const [partitionKey, setPartitionKey] = useState("pk");
  const [sortKey, setSortKey] = useState("sk");
  const [billingMode, setBillingMode] = useState<
    "PAY_PER_REQUEST" | "PROVISIONED"
  >("PAY_PER_REQUEST");
  const [readCapacity, setReadCapacity] = useState(5);
  const [writeCapacity, setWriteCapacity] = useState(5);
  const [gsis, setGsis] = useState<DynamoDBGSI[]>([]);

  if (!isOpen) return null;

  const addGSI = () => {
    if (gsis.length >= 4) return;

    const newGSI: DynamoDBGSI = {
      indexName: `gsi-${gsis.length + 1}`,
      partitionKey: "pk",
      sortKey: "sk",
      projectionType: "ALL",
      nonKeyAttributes: [],
    };
    setGsis([...gsis, newGSI]);
  };

  const removeGSI = (index: number) => {
    setGsis(gsis.filter((_, i) => i !== index));
  };

  const updateGSI = (index: number, field: keyof DynamoDBGSI, value: any) => {
    const updatedGsis = [...gsis];
    updatedGsis[index] = { ...updatedGsis[index], [field]: value };
    setGsis(updatedGsis);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: DynamoDBTableConfig = {
      tableName,
      partitionKey,
      sortKey,
      billingMode,
      readCapacity: billingMode === "PROVISIONED" ? readCapacity : undefined,
      writeCapacity: billingMode === "PROVISIONED" ? writeCapacity : undefined,
      gsis,
    };
    onSubmit(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          DynamoDB Table Configuration
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Configure your DynamoDB table with composite primary key and Global
          Secondary Indexes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Table Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Name
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Mode
              </label>
              <select
                value={billingMode}
                onChange={(e) =>
                  setBillingMode(
                    e.target.value as "PAY_PER_REQUEST" | "PROVISIONED"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="PAY_PER_REQUEST">Pay Per Request</option>
                <option value="PROVISIONED">Provisioned</option>
              </select>
            </div>
          </div>

          {/* Primary Key Configuration */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Primary Key
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partition Key (PK)
                </label>
                <input
                  type="text"
                  value={partitionKey}
                  onChange={(e) => setPartitionKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Key (SK){" "}
                  <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Leave empty for simple primary key"
                />
              </div>
            </div>
          </div>

          {/* Provisioned Capacity (only show if billing mode is PROVISIONED) */}
          {billingMode === "PROVISIONED" && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Provisioned Capacity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Read Capacity Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={readCapacity}
                    onChange={(e) => setReadCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Write Capacity Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={writeCapacity}
                    onChange={(e) => setWriteCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Global Secondary Indexes */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Global Secondary Indexes
              </h3>
              <button
                type="button"
                onClick={addGSI}
                disabled={gsis.length >= 4}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add GSI ({gsis.length}/4)
              </button>
            </div>

            {gsis.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No GSIs configured. Click "Add GSI" to create up to 4 Global
                Secondary Indexes.
              </p>
            )}

            {gsis.map((gsi, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">GSI {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeGSI(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Index Name
                    </label>
                    <input
                      type="text"
                      value={gsi.indexName}
                      onChange={(e) =>
                        updateGSI(index, "indexName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partition Key
                    </label>
                    <input
                      type="text"
                      value={gsi.partitionKey}
                      onChange={(e) =>
                        updateGSI(index, "partitionKey", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Key <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={gsi.sortKey || ""}
                      onChange={(e) =>
                        updateGSI(index, "sortKey", e.target.value || undefined)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projection Type
                    </label>
                    <select
                      value={gsi.projectionType}
                      onChange={(e) =>
                        updateGSI(
                          index,
                          "projectionType",
                          e.target.value as "ALL" | "KEYS_ONLY" | "INCLUDE"
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="ALL">All</option>
                      <option value="KEYS_ONLY">Keys Only</option>
                      <option value="INCLUDE">Include</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
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
              {loading ? "Creating..." : "Create Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
