import type { Config } from "../types/Config.ts";
import { showError } from "../presentation/output.ts";
import { saveCities } from "../storage/citiesStorage.ts";
import { saveSettings } from "../storage/settingsStorage.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { errorMessage } from "../utils/errors.ts";

async function persist(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    showError(`No se pudo guardar la configuración: ${errorMessage(error)}`);
  }
}

export async function persistCities(
  config: Config,
  paths: StoragePaths = getStoragePaths(),
): Promise<void> {
  await persist(() =>
    saveCities({ defaultCityId: config.defaultCityId, cities: config.cities }, paths),
  );
}

export async function persistSettings(
  config: Config,
  paths: StoragePaths = getStoragePaths(),
): Promise<void> {
  await persist(() => saveSettings({ unit: config.unit }, paths));
}
