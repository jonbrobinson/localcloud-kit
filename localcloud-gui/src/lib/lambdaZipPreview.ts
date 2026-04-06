"use client";

import { strFromU8, unzipSync } from "fflate";

export interface LambdaPreviewFile {
  name: string;
  content: string;
}

/** Reject zip-slip style paths; return normalized forward-slash path or null. */
export function sanitizeZipEntryName(path: string): string | null {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = normalized.split("/").filter((p) => p.length > 0);
  if (parts.some((p) => p === "..")) return null;
  return parts.join("/");
}

function isProbablyText(bytes: Uint8Array): boolean {
  const n = Math.min(8000, bytes.length);
  for (let i = 0; i < n; i++) {
    if (bytes[i] === 0) return false;
  }
  return true;
}

const MAX_FILES = 400;
const MAX_UNCOMPRESSED_BYTES = 2 * 1024 * 1024;

/**
 * Read a local deployment zip in the browser (same shape as API code preview).
 */
export async function parseLambdaZipFile(file: File): Promise<{ files: LambdaPreviewFile[]; error?: string }> {
  const lower = file.name.toLowerCase();
  const okType =
    lower.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";
  if (!okType) {
    return { files: [], error: "Please choose a .zip file." };
  }

  let buf: ArrayBuffer;
  try {
    buf = await file.arrayBuffer();
  } catch {
    return { files: [], error: "Could not read the file." };
  }

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(new Uint8Array(buf), {
      filter: (entry) => entry.originalSize <= MAX_UNCOMPRESSED_BYTES,
    });
  } catch {
    return { files: [], error: "This file is not a valid zip archive." };
  }

  const files: LambdaPreviewFile[] = [];
  const names = Object.keys(unzipped).sort((a, b) => a.localeCompare(b));

  for (const path of names) {
    if (path.endsWith("/")) continue;
    const safe = sanitizeZipEntryName(path);
    if (!safe) continue;

    const raw = unzipped[path];
    if (!raw) continue;

    if (raw.length > MAX_UNCOMPRESSED_BYTES) {
      files.push({
        name: safe,
        content: `(${Math.round(raw.length / 1024)} KB — too large to preview here)`,
      });
    } else if (isProbablyText(raw)) {
      files.push({ name: safe, content: strFromU8(raw, false) });
    } else {
      files.push({ name: safe, content: "" });
    }

    if (files.length >= MAX_FILES) break;
  }

  if (files.length === 0) {
    return { files: [], error: "No files found in the zip (empty or folders only)." };
  }

  return { files };
}
