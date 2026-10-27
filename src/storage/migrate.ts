import { rename } from "node:fs/promises";
import type { Config } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { isRecord } from "../utils/errors.ts";
import { isCitiesData } from "./citiesStorage.ts";
import { backupFile, fileExists, readJsonFile, writeJsonFile } from "./jsonFile.ts";
import { isUnit } from "./settingsStorage.ts";

function isLegacyConfig(value: unknown): value is Config {
  return isRecord(value) && isCitiesData(value) && isUnit(value.unit);
}

async function markLegacyAsMigrated(legacyPath: string): Promise<void> {
  try {
    await rename(legacyPath, `${legacyPath}.migrated`);
  } catch {
    return;
  }
}

export async function migrateLegacyConfig(
  paths: StoragePaths = getStoragePaths(),
): Promise<void> {
  if (!(await fileExists(paths.legacy))) {
    return;
  }

  if ((await fileExists(paths.cities)) && (await fileExists(paths.settings))) {
    return;
  }

  const legacy = await readJsonFile(paths.legacy);
  if (legacy === undefined) {
    return;
  }

  if (!isLegacyConfig(legacy)) {
    await backupFile(paths.legacy);
    return;
  }

  const hasDefault = legacy.cities.some((city) => city.id === legacy.defaultCityId);
  const defaultCityId = legacy.defaultCityId !== null && hasDefault ? legacy.defaultCityId : null;

  if (!(await fileExists(paths.cities))) {
    await writeJsonFile(paths.cities, { defaultCityId, cities: legacy.cities });
  }

  if (!(await fileExists(paths.settings))) {
    await writeJsonFile(paths.settings, { unit: legacy.unit });
  }

  await markLegacyAsMigrated(paths.legacy);
}
