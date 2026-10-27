import { randomUUID } from "node:crypto";
import { searchCities } from "../api/geocoding.ts";
import type { Prompt } from "../presentation/input.ts";
import { parseIndex } from "../presentation/input.ts";
import { showError, showInfo, showSuccess } from "../presentation/output.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { errorMessage } from "../utils/errors.ts";
import { placeLabel } from "../utils/format.ts";
import { persistCities } from "./persist.ts";

export async function addCity(
  prompt: Prompt,
  config: Config,
  paths: StoragePaths = getStoragePaths(),
): Promise<Config> {
  const query = (await prompt.ask("  Nombre de la ciudad: ")).trim();
  if (query.length === 0) {
    showError("Debes ingresar el nombre de una ciudad.");
    return config;
  }

  showInfo("  Buscando ciudades...");

  let results;
  try {
    results = await searchCities(query);
  } catch (error) {
    showError(errorMessage(error));
    return config;
  }

  if (results.length === 0) {
    showInfo(`  No se encontraron ciudades para "${query}".`);
    return config;
  }

  showInfo("\n  Resultados:");
  results.forEach((result, index) => {
    showInfo(`  ${index + 1}. ${placeLabel(result)}`);
  });

  const selection = (await prompt.ask("  Selecciona una ciudad (Enter para cancelar): ")).trim();
  if (selection.length === 0) {
    showInfo("  Operación cancelada.");
    return config;
  }

  const index = parseIndex(selection, results.length);
  const selected = index === null ? undefined : results[index];
  if (!selected) {
    showError("Selección inválida.");
    return config;
  }

  const duplicate = config.cities.find(
    (city) => city.latitude === selected.latitude && city.longitude === selected.longitude,
  );
  if (duplicate) {
    showInfo(`  ${placeLabel(duplicate)} ya está en la lista.`);
    return config;
  }

  const city: City = {
    id: randomUUID(),
    name: selected.name,
    latitude: selected.latitude,
    longitude: selected.longitude,
  };
  if (selected.admin1) {
    city.admin1 = selected.admin1;
  }
  if (selected.country) {
    city.country = selected.country;
  }

  config.cities.push(city);

  if (config.defaultCityId === null) {
    config.defaultCityId = city.id;
    showSuccess(`  Agregada: ${placeLabel(city)} (establecida como default).`);
  } else {
    showSuccess(`  Agregada: ${placeLabel(city)}.`);
  }

  await persistCities(config, paths);
  return config;
}
