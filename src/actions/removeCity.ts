import type { Prompt } from "../presentation/input.ts";
import { askConfirmation, parseIndex } from "../presentation/input.ts";
import { showError, showInfo, showSuccess } from "../presentation/output.ts";
import type { Config } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { placeLabel } from "../utils/format.ts";
import { listCities } from "./listCities.ts";
import { persistCities } from "./persist.ts";

export async function removeCity(
  prompt: Prompt,
  config: Config,
  paths: StoragePaths = getStoragePaths(),
): Promise<Config> {
  if (config.cities.length === 0) {
    showInfo("  No hay ciudades para eliminar.");
    return config;
  }

  listCities(config);

  const input = (await prompt.ask("  Número de ciudad a eliminar (Enter para cancelar): ")).trim();
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

  const confirmed = await askConfirmation(prompt, `  ¿Eliminar ${placeLabel(city)}? (s/n): `);
  if (!confirmed) {
    showInfo("  Operación cancelada.");
    return config;
  }

  config.cities.splice(index, 1);
  showSuccess(`  Eliminada: ${placeLabel(city)}.`);

  if (config.defaultCityId === city.id) {
    config.defaultCityId = null;
    showInfo("  La ciudad default quedó sin asignar.");
  }

  await persistCities(config, paths);
  return config;
}
