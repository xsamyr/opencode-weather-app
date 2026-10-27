import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { migrateLegacyConfig } from "../../src/storage/migrate.ts";
import type { CitiesData, Settings } from "../../src/types/Config.ts";
import { makeCity } from "../helpers/fixtures.ts";
import {
  createTempStorage,
  fileExists,
  readJson,
  type TempStorage,
} from "../helpers/tempStorage.ts";

let temp: TempStorage | undefined;

beforeEach(async () => {
  temp = await createTempStorage();
});

afterEach(async () => {
  await temp?.cleanup();
  temp = undefined;
});

function currentTemp(): TempStorage {
  if (!temp) {
    throw new Error("El almacenamiento temporal no está inicializado.");
  }
  return temp;
}

async function writeLegacy(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("migrateLegacyConfig", () => {
  test("no hace nada si no existe el archivo legacy", async () => {
    const { paths } = currentTemp();

    await migrateLegacyConfig(paths);

    expect(await fileExists(paths.cities)).toBe(false);
    expect(await fileExists(paths.settings)).toBe(false);
  });

  test("no migra si ya existen ambos archivos nuevos", async () => {
    const { paths } = currentTemp();
    const cities: CitiesData = { defaultCityId: null, cities: [] };
    const settings: Settings = { unit: "celsius" };
    await writeFile(paths.cities, JSON.stringify(cities), "utf8");
    await writeFile(paths.settings, JSON.stringify(settings), "utf8");
    await writeLegacy(paths.legacy, {
      defaultCityId: "a",
      cities: [makeCity({ id: "a" })],
      unit: "fahrenheit",
    });

    await migrateLegacyConfig(paths);

    expect(await readJson(paths.cities)).toEqual(cities);
    expect(await readJson(paths.settings)).toEqual(settings);
    expect(await fileExists(paths.legacy)).toBe(true);
    expect(await fileExists(`${paths.legacy}.migrated`)).toBe(false);
  });

  test("migra ciudades, default y ajustes", async () => {
    const { paths } = currentTemp();
    const city = makeCity({ id: "a", name: "Ottawa" });
    await writeLegacy(paths.legacy, {
      defaultCityId: "a",
      cities: [city],
      unit: "fahrenheit",
    });

    await migrateLegacyConfig(paths);

    expect(await readJson<CitiesData>(paths.cities)).toEqual({
      defaultCityId: "a",
      cities: [city],
    });
    expect(await readJson<Settings>(paths.settings)).toEqual({ unit: "fahrenheit" });
    expect(await fileExists(paths.legacy)).toBe(false);
    expect(await fileExists(`${paths.legacy}.migrated`)).toBe(true);
  });

  test("normaliza un default inexistente durante la migración", async () => {
    const { paths } = currentTemp();
    await writeLegacy(paths.legacy, {
      defaultCityId: "inexistente",
      cities: [makeCity({ id: "a" })],
      unit: "celsius",
    });

    await migrateLegacyConfig(paths);

    const cities = await readJson<CitiesData>(paths.cities);
    expect(cities.defaultCityId).toBeNull();
    expect(cities.cities).toHaveLength(1);
  });

  test("migra solo los archivos que faltan", async () => {
    const { paths } = currentTemp();
    const existing: CitiesData = { defaultCityId: null, cities: [] };
    await writeFile(paths.cities, JSON.stringify(existing), "utf8");
    await writeLegacy(paths.legacy, {
      defaultCityId: "a",
      cities: [makeCity({ id: "a" })],
      unit: "celsius",
    });

    await migrateLegacyConfig(paths);

    expect(await readJson(paths.cities)).toEqual(existing);
    expect(await readJson<Settings>(paths.settings)).toEqual({ unit: "celsius" });
    expect(await fileExists(`${paths.legacy}.migrated`)).toBe(true);
  });

  test("respalda una configuración legacy inválida", async () => {
    const { paths } = currentTemp();
    await writeLegacy(paths.legacy, { defaultCityId: null, cities: [], unit: "kelvin" });

    await migrateLegacyConfig(paths);

    expect(await fileExists(paths.cities)).toBe(false);
    expect(await fileExists(paths.settings)).toBe(false);
    expect(await fileExists(paths.legacy)).toBe(false);
    expect(await fileExists(`${paths.legacy}.bak`)).toBe(true);
  });

  test("no falla si no puede marcar el legacy como migrado", async () => {
    const { paths } = currentTemp();
    await mkdir(`${paths.legacy}.migrated`);
    await writeLegacy(paths.legacy, {
      defaultCityId: "a",
      cities: [makeCity({ id: "a" })],
      unit: "celsius",
    });

    await expect(migrateLegacyConfig(paths)).resolves.toBeUndefined();

    expect(await fileExists(paths.cities)).toBe(true);
    expect(await fileExists(paths.settings)).toBe(true);
    expect(await fileExists(paths.legacy)).toBe(true);
  });

  test("respalda un JSON legacy corrupto", async () => {
    const { paths } = currentTemp();
    await writeFile(paths.legacy, "{legacy-roto", "utf8");

    await migrateLegacyConfig(paths);

    expect(await fileExists(paths.cities)).toBe(false);
    expect(await fileExists(paths.settings)).toBe(false);
    expect(await fileExists(paths.legacy)).toBe(false);
    expect(await fileExists(`${paths.legacy}.bak`)).toBe(true);
  });
});
