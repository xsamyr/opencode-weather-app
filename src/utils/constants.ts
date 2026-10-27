import { homedir } from "node:os";
import { join } from "node:path";

export const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const REQUEST_TIMEOUT_MS = 10_000;
export const GEOCODING_RESULT_COUNT = 5;

export const CONFIG_DIR = join(homedir(), ".config", "weather-cli");
export const CITIES_PATH = join(CONFIG_DIR, "cities.json");
export const SETTINGS_PATH = join(CONFIG_DIR, "settings.json");
export const LEGACY_CONFIG_PATH = join(homedir(), ".weather-cli.json");

export interface StoragePaths {
  cities: string;
  settings: string;
  legacy: string;
}

export function getStoragePaths(): StoragePaths {
  return {
    cities: CITIES_PATH,
    settings: SETTINGS_PATH,
    legacy: LEGACY_CONFIG_PATH,
  };
}

export const MENU_LINE = "═".repeat(40);
