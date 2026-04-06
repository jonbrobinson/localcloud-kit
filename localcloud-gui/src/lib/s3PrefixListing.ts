/**
 * S3-style delimiter listing: at a given prefix, return virtual "folders" (common key
 * prefixes ending in /) plus object keys that are direct children (no extra / in the
 * relative segment). Matches console-style browsing so nested keys like `a/b/c.png`
 * appear under a navigable `a/` folder at the bucket root.
 */
export interface S3ListItem {
  Key?: string;
  Name?: string;
  Size?: number;
  LastModified?: string;
  [key: string]: unknown;
}

export function normalizeS3Prefix(prefix: string): string {
  if (!prefix) return "";
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

export function listS3ObjectsAtPrefix(all: S3ListItem[], prefix: string): S3ListItem[] {
  const normPrefix = normalizeS3Prefix(prefix);
  const folderKeys = new Set<string>();
  const files: S3ListItem[] = [];

  for (const item of all) {
    const key = item.Key || "";
    if (!key.startsWith(normPrefix)) continue;
    const rest = key.slice(normPrefix.length);
    if (!rest) continue;
    const slash = rest.indexOf("/");
    if (slash === -1) {
      files.push(item);
    } else {
      folderKeys.add(normPrefix + rest.slice(0, slash + 1));
    }
  }

  const folders: S3ListItem[] = Array.from(folderKeys)
    .sort()
    .map((Key) => ({ Key, Size: 0 }));

  files.sort((a, b) => (a.Key || "").localeCompare(b.Key || ""));
  return [...folders, ...files];
}
