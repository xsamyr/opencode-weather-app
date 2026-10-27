import type { City } from "../types/City.ts";
import type { CitiesData } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { isRecord } from "../utils/errors.ts";
import { backupFile, readJsonFile, writeJsonFile } from "./jsonFile.ts";

export function createDefaultCitiesData(): CitiesData {
  return { defaultCityId: null, cities: [] };
}

export function isCity(value: unknown): value is City {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    (value.admin1 === undefined || typeof value.admin1 === "string") &&
    (value.country === undefined || typeof value.country === "string")
  );
}

export function isCitiesData(value: unknown): value is CitiesData {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value.defaultCityId === null || typeof value.defaultCityId === "string") &&
    Array.isArray(value.cities) &&
    value.cities.every(isCity)
  );
}

export async function loadCities(paths: StoragePaths = getStoragePaths()): Promise<CitiesData> {
  const parsed = await readJsonFile(paths.cities);
  if (parsed === undefined) {
    return createDefaultCitiesData();
  }

  if (!isCitiesData(parsed)) {
    await backupFile(paths.cities);
    return createDefaultCitiesData();
  }

  const hasDefault = parsed.cities.some((city) => city.id === parsed.defaultCityId);
  if (parsed.defaultCityId !== null && !hasDefault) {
    parsed.defaultCityId = null;
  }

  return parsed;
}

export async function saveCities(
  data: CitiesData,
  paths: StoragePaths = getStoragePaths(),
): Promise<void> {
  await writeJsonFile(paths.cities, data);
}
