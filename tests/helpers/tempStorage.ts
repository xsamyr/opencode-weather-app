import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StoragePaths } from "../../src/utils/constants.ts";

export interface TempStorage {
  root: string;
  paths: StoragePaths;
  cleanup(): Promise<void>;
}

export async function createTempStorage(): Promise<TempStorage> {
  const root = await mkdtemp(join(tmpdir(), "weather-cli-test-"));

  return {
    root,
    paths: {
      cities: join(root, "cities.json"),
      settings: join(root, "settings.json"),
      legacy: join(root, "legacy.json"),
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
