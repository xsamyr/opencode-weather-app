import { describe, expect, test } from "bun:test";
import {
  CITIES_PATH,
  CONFIG_DIR,
  getStoragePaths,
  LEGACY_CONFIG_PATH,
  MENU_LINE,
  SETTINGS_PATH,
} from "../../src/utils/constants.ts";

describe("constants", () => {
  test("expone las rutas de almacenamiento por defecto", () => {
    expect(getStoragePaths()).toEqual({
      cities: CITIES_PATH,
      settings: SETTINGS_PATH,
      legacy: LEGACY_CONFIG_PATH,
    });
    expect(CITIES_PATH.startsWith(CONFIG_DIR)).toBe(true);
    expect(SETTINGS_PATH.startsWith(CONFIG_DIR)).toBe(true);
    expect(LEGACY_CONFIG_PATH.endsWith(".weather-cli.json")).toBe(true);
  });

  test("define la línea visual del menú", () => {
    expect(MENU_LINE).toHaveLength(40);
    expect(MENU_LINE).toBe("═".repeat(40));
  });
});
