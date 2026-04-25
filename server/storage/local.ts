import fs from "fs";
import path from "path";
import { ENV } from "../_core/env";

export interface StorageResult {
  key: string;
  url: string;
  path: string;
}

/**
 * Ensure storage directory exists
 */
function ensureStorageDir(): void {
  const dir = ENV.storagePath;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Upload file to local storage
 */
export async function uploadFile(
  relativeKey: string,
  data: Buffer | string,
  contentType?: string
): Promise<StorageResult> {
  ensureStorageDir();

  const filePath = path.join(ENV.storagePath, relativeKey);
  const dir = path.dirname(filePath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  const buffer = typeof data === "string" ? Buffer.from(data) : data;
  fs.writeFileSync(filePath, buffer);

  return {
    key: relativeKey,
    url: `/storage/${relativeKey}`,
    path: filePath,
  };
}

/**
 * Download file from local storage
 */
export async function downloadFile(relativeKey: string): Promise<Buffer | null> {
  const filePath = path.join(ENV.storagePath, relativeKey);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath);
}

/**
 * Get file info
 */
export async function getFileInfo(relativeKey: string): Promise<{
  exists: boolean;
  size?: number;
  path?: string;
} | null> {
  const filePath = path.join(ENV.storagePath, relativeKey);

  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }

  const stats = fs.statSync(filePath);
  return {
    exists: true,
    size: stats.size,
    path: filePath,
  };
}

/**
 * Delete file from local storage
 */
export async function deleteFile(relativeKey: string): Promise<boolean> {
  const filePath = path.join(ENV.storagePath, relativeKey);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

/**
 * List files in directory
 */
export async function listFiles(prefix: string = ""): Promise<string[]> {
  ensureStorageDir();

  const dir = prefix ? path.join(ENV.storagePath, prefix) : ENV.storagePath;

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];

  function walkDir(currentPath: string, relativePrefix: string = ""): void {
    const entries = fs.readdirSync(currentPath);

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const relativePath = relativePrefix ? `${relativePrefix}/${entry}` : entry;

      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        files.push(relativePath);
      } else if (stats.isDirectory()) {
        walkDir(fullPath, relativePath);
      }
    }
  }

  walkDir(dir);
  return files;
}
