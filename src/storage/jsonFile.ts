import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { isRecord } from "../utils/errors.ts";

export function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }
    throw error;
  }
}

export async function backupFile(path: string): Promise<void> {
  try {
    await rename(path, `${path}.bak`);
  } catch {
    return;
  }
}

export async function readJsonFile(path: string): Promise<unknown | undefined> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }

  try {
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    await backupFile(path);
    return undefined;
  }
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}
