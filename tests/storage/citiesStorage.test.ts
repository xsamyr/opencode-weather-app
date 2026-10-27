import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import {
  createDefaultCitiesData,
  isCitiesData,
  isCity,
  loadCities,
  saveCities,
} from "../../src/storage/citiesStorage.ts";
import type { City } from "../../src/types/City.ts";
import type { CitiesData } from "../../src/types/Config.ts";
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

describe("citiesStorage", () => {
  test("crea datos por defecto", () => {
    expect(createDefaultCitiesData()).toEqual({ defaultCityId: null, cities: [] });
  });

  test("valida ciudades correctamente", () => {
    const full = makeCity({ id: "a", admin1: "Ontario", country: "Canadá" });
    const minimal = makeCity({ id: "b", name: "Lima", admin1: undefined, country: undefined });

    expect(isCity(full)).toBe(true);
    expect(isCity(minimal)).toBe(true);
    expect(isCity(null)).toBe(false);
    expect(isCity({})).toBe(false);
    expect(isCity([])).toBe(false);
    expect(isCity({ ...full, id: 1 })).toBe(false);
    expect(isCity({ ...full, name: null })).toBe(false);
    expect(isCity({ ...full, latitude: "45" })).toBe(false);
    expect(isCity({ ...full, longitude: null })).toBe(false);
    expect(isCity({ ...full, admin1: null })).toBe(false);
    expect(isCity({ ...full, country: 5 })).toBe(false);
  });

  test("valida los datos completos de ciudades", () => {
    const city = makeCity({ id: "a" });
    const valid: CitiesData = { defaultCityId: "a", cities: [city] };

    expect(isCitiesData(valid)).toBe(true);
    expect(isCitiesData({ defaultCityId: null, cities: [] })).toBe(true);
    expect(isCitiesData(null)).toBe(false);
    expect(isCitiesData({ defaultCityId: 1, cities: [] })).toBe(false);
    expect(isCitiesData({ defaultCityId: null, cities: "nada" })).toBe(false);
    expect(isCitiesData({ defaultCityId: null, cities: [{ id: "x" }] })).toBe(false);
  });

  test("devuelve los datos por defecto si el archivo no existe", async () => {
    const { paths } = currentTemp();
    expect(await loadCities(paths)).toEqual(createDefaultCitiesData());
  });

  test("respalda los datos inválidos", async () => {
    const { paths } = currentTemp();
    await writeFile(paths.cities, '{"defaultCityId":5,"cities":[]}', "utf8");

    expect(await loadCities(paths)).toEqual(createDefaultCitiesData());
    expect(await fileExists(paths.cities)).toBe(false);
    expect(await fileExists(`${paths.cities}.bak`)).toBe(true);
  });

  test("normaliza un default que no existe", async () => {
    const { paths } = currentTemp();
    const city = makeCity({ id: "a" });
    const data: CitiesData = { defaultCityId: "inexistente", cities: [city] };
    await writeFile(paths.cities, JSON.stringify(data), "utf8");

    const loaded = await loadCities(paths);
    expect(loaded.defaultCityId).toBeNull();
    expect(loaded.cities).toEqual([city]);
  });

  test("guarda y recupera las ciudades", async () => {
    const { paths } = currentTemp();
    const first = makeCity({ id: "a", name: "Ottawa", admin1: "Ontario", country: "Canadá" });
    const second = makeCity({ id: "b", name: "Lima", latitude: -12.04, longitude: -77.03 });
    const data: CitiesData = { defaultCityId: "a", cities: [first, second] };

    await saveCities(data, paths);

    expect(await readJson<CitiesData>(paths.cities)).toEqual(data);
    expect(await loadCities(paths)).toEqual(data);
  });
});
