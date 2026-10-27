import type { Settings, Unit } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { isRecord } from "../utils/errors.ts";
import { backupFile, readJsonFile, writeJsonFile } from "./jsonFile.ts";

export function createDefaultSettings(): Settings {
  return { unit: "celsius" };
}

export function isUnit(value: unknown): value is Unit {
  return value === "celsius" || value === "fahrenheit";
}

function isSettings(value: unknown): value is Settings {
  return isRecord(value) && isUnit(value.unit);
}

export async function loadSettings(
  paths: StoragePaths = getStoragePaths(),
): Promise<Settings> {
  const parsed = await readJsonFile(paths.settings);
  if (parsed === undefined) {
    return createDefaultSettings();
  }

  if (!isSettings(parsed)) {
    await backupFile(paths.settings);
    return createDefaultSettings();
  }

  return parsed;
}

export async function saveSettings(
  settings: Settings,
  paths: StoragePaths = getStoragePaths(),
): Promise<void> {
  await writeJsonFile(paths.settings, settings);
}
