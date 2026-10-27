import type { Prompt } from "../presentation/input.ts";
import { parseIndex } from "../presentation/input.ts";
import { showError, showInfo, showSuccess } from "../presentation/output.ts";
import type { Config } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { placeLabel } from "../utils/format.ts";
import { listCities } from "./listCities.ts";
import { persistCities } from "./persist.ts";

export async function setDefaultCity(
  prompt: Prompt,
  config: Config,
  paths: StoragePaths = getStoragePaths(),
): Promise<Config> {
  if (config.cities.length === 0) {
    showInfo("  No hay ciudades guardadas. Agrega una con la opción 3.");
    return config;
  }

  listCities(config);

  const input = (await prompt.ask("  Número de ciudad default (Enter para cancelar): ")).trim();
  if (input.length === 0) {
    showInfo("  Operación cancelada.");
    return config;
  }

  const index = parseIndex(input, config.cities.length);
  const city = index === null ? undefined : config.cities[index];
  if (index === null || !city) {
    showError("Selección inválida.");
    return config;
  }

  config.defaultCityId = city.id;
  await persistCities(config, paths);
  showSuccess(`  Ciudad default: ${placeLabel(city)}.`);
  return config;
}
