"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { s3Api } from "@/services/api";
import { toast } from "react-hot-toast";
import { Button, IconButton } from "@/components/ui";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!objectKey.trim()) {
      toast.error("Please enter a file name");
      return;
    }

    // Use multipart upload if a file is selected, otherwise use text content
    if (selectedFile) {
      setUploading(true);
      try {
        const response = await s3Api.uploadObjectMultipart(
          projectName,
          bucketName,
          objectKey,
          selectedFile
        );

        if (response.success) {
          const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
          toast.success(`File uploaded successfully (${sizeMB} MB)`);
          setObjectKey("");
          setContent("");
          setSelectedFile(null);
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
    } else if (content.trim()) {
      // Fallback to text upload for manual content entry
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
    } else {
      toast.error("Please select a file or enter content");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setObjectKey(file.name);
      setSelectedFile(file);

      // For text files, show preview in the textarea
      const isTextFile =
        file.type.startsWith("text/") ||
        file.type === "application/json" ||
        file.type === "application/xml" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".xml") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".md");

      if (isTextFile && file.size < 1024 * 1024) {
        // Only preview files < 1MB
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setContent(result);
        };
        reader.readAsText(file);
      } else {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setContent(`[Binary file selected: ${file.name} (${sizeMB} MB)]`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4">
      <div className="bg-surface border border-border rounded-xl shadow-e3 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-soft text-primary">
              <Icon icon="lucide:upload" width={17} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Upload file</h2>
              <p className="text-xs text-muted font-mono">{bucketName}</p>
            </div>
          </div>
          <IconButton icon="lucide:x" label="Close" variant="ghost" onClick={onClose} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Choose file
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-ink-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary-soft file:text-primary-ink hover:file:bg-primary-soft/80 cursor-pointer"
            />
          </div>

          {/* Object Key */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              File name (object key)
            </label>
            <input
              type="text"
              value={objectKey}
              onChange={(e) => setObjectKey(e.target.value)}
              placeholder="e.g. seed/users.json"
              className="w-full h-9 px-3 rounded-lg border border-border-strong bg-surface-2 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:bg-surface focus:border-primary focus:ring-3 focus:ring-focus"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              File content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter file content…"
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-border-strong bg-surface-2 font-mono text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint focus:bg-surface focus:border-primary focus:ring-3 focus:ring-focus resize-vertical"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-divider shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={uploading ? undefined : "lucide:upload"}
            loading={uploading}
            onClick={handleUpload}
            disabled={
              uploading ||
              !objectKey.trim() ||
              (!selectedFile && !content.trim())
            }
          >
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      </div>
    </div>
  );
}
