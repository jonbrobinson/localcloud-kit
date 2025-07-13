"use client";

import { useState } from "react";
import { XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { s3Api } from "@/services/api";
import { toast } from "react-hot-toast";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  bucketName: string;
  onUploadSuccess: () => void;
}

export default function UploadFileModal({
  isOpen,
  onClose,
  projectName,
  bucketName,
  onUploadSuccess,
}: UploadFileModalProps) {
  const [objectKey, setObjectKey] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!objectKey.trim()) {
      toast.error("Please enter a file name");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter file content");
      return;
    }

    setUploading(true);
    try {
      const response = await s3Api.uploadObject(
        projectName,
        bucketName,
        objectKey,
        content
      );

      if (response.success) {
        toast.success("File uploaded successfully");
        setObjectKey("");
        setContent("");
        onUploadSuccess();
        onClose();
      } else {
        toast.error(response.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setObjectKey(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // For binary files (like images), we need to handle the data URL properly
        if (result.startsWith('data:')) {
          // Extract the base64 content from the data URL
          const base64Content = result.split(',')[1];
          setContent(base64Content);
        } else {
          setContent(result);
        }
      };
      
      // Check if it's a text file or binary file
      const isTextFile = file.type.startsWith('text/') || 
                        file.type === 'application/json' || 
                        file.type === 'application/xml' ||
                        file.name.endsWith('.txt') ||
                        file.name.endsWith('.json') ||
                        file.name.endsWith('.xml') ||
                        file.name.endsWith('.csv') ||
                        file.name.endsWith('.md');
      
      if (isTextFile) {
        reader.readAsText(file);
      } else {
        // For binary files (images, etc.), read as data URL
        reader.readAsDataURL(file);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Upload File to {bucketName}
            </h2>
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
        <div className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Object Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name (Object Key)
            </label>
            <input
              type="text"
              value={objectKey}
              onChange={(e) => setObjectKey(e.target.value)}
              placeholder="Enter file name (e.g., myfile.txt)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter file content..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !objectKey.trim() || !content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}
