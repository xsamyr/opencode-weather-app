import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { addCity } from "../../src/actions/addCity.ts";
import type { CitiesData } from "../../src/types/Config.ts";
import { captureStdoutAsync } from "../helpers/captureOutput.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";
import { installFetchMock, jsonResponse } from "../helpers/fetchMock.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";
import {
  createTempStorage,
  fileExists,
  readJson,
  type TempStorage,
} from "../helpers/tempStorage.ts";

const originalNoColor = process.env.NO_COLOR;
type FetchMock = ReturnType<typeof installFetchMock>;

let temp: TempStorage | undefined;
let fetchMock: FetchMock | undefined;

beforeEach(async () => {
  process.env.NO_COLOR = "1";
  temp = await createTempStorage();
});

afterEach(async () => {
  fetchMock?.mockRestore();
  fetchMock = undefined;
  await temp?.cleanup();
  temp = undefined;
  if (originalNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = originalNoColor;
  }
});

function currentTemp(): TempStorage {
  if (!temp) {
    throw new Error("El almacenamiento temporal no está inicializado.");
  }
  return temp;
}

describe("addCity", () => {
  test("rechaza una búsqueda vacía sin llamar a la API", async () => {
    const { paths } = currentTemp();
    const config = makeConfig();
    const prompt = createFakePrompt([""]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result).toBe(config);
    expect(output).toContain("Debes ingresar el nombre de una ciudad.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("muestra el error cuando falla la búsqueda", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () => jsonResponse({}, { status: 500 }));
    const config = makeConfig();
    const prompt = createFakePrompt(["Ottawa"]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result.cities).toEqual([]);
    expect(output).toContain("La búsqueda de ciudades respondió con estado 500.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("informa cuando no hay resultados", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () => jsonResponse({ results: [] }));
    const config = makeConfig();
    const prompt = createFakePrompt(["Atlantis"]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result.cities).toEqual([]);
    expect(prompt.questions).toHaveLength(1);
    expect(output).toContain('No se encontraron ciudades para "Atlantis".');
  });

  test("cancela la selección con Enter", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Ottawa", latitude: 45.4, longitude: -75.7 }] }),
    );
    const config = makeConfig();
    const prompt = createFakePrompt(["Ottawa", ""]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result.cities).toEqual([]);
    expect(output).toContain("Operación cancelada.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("rechaza una selección inválida", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Ottawa", latitude: 45.4, longitude: -75.7 }] }),
    );
    const config = makeConfig();
    const prompt = createFakePrompt(["Ottawa", "abc"]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result.cities).toEqual([]);
    expect(output).toContain("Selección inválida.");
  });

  test("evita agregar una ciudad duplicada por coordenadas", async () => {
    const { paths } = currentTemp();
    const existing = makeCity({
      id: "a",
      name: "Ottawa",
      latitude: 45.4,
      longitude: -75.7,
    });
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Ottawa", latitude: 45.4, longitude: -75.7 }] }),
    );
    const config = makeConfig({ defaultCityId: "a", cities: [existing] });
    const prompt = createFakePrompt(["Ottawa", "1"]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result.cities).toEqual([existing]);
    expect(output).toContain("Ottawa ya está en la lista.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("agrega la primera ciudad como default y la persiste", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({
        results: [
          {
            name: "Ottawa",
            latitude: 45.41117,
            longitude: -75.69812,
            admin1: "Ontario",
            country: "Canadá",
          },
        ],
      }),
    );
    const config = makeConfig();
    const prompt = createFakePrompt(["Ottawa", "1"]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    const city = result.cities[0];
    if (!city) {
      throw new Error("La ciudad no fue agregada.");
    }
    expect(typeof city.id).toBe("string");
    expect(city.id.length).toBeGreaterThan(0);
    expect(city).toMatchObject({
      name: "Ottawa",
      latitude: 45.41117,
      longitude: -75.69812,
      admin1: "Ontario",
      country: "Canadá",
    });
    expect(result.defaultCityId).toBe(city.id);
    expect(output).toContain("Agregada: Ottawa (Ontario, Canadá) (establecida como default).");
    expect(await readJson<CitiesData>(paths.cities)).toEqual({
      defaultCityId: city.id,
      cities: result.cities,
    });
  });

  test("agrega una ciudad sin cambiar el default existente", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Lima", latitude: -12.04, longitude: -77.03 }] }),
    );
    const config = makeConfig({
      defaultCityId: "a",
      cities: [makeCity({ id: "a", name: "Ottawa" })],
    });
    const prompt = createFakePrompt(["Lima", "1"]);

    const { result, output } = await captureStdoutAsync(() => addCity(prompt, config, paths));

    expect(result.cities).toHaveLength(2);
    expect(result.defaultCityId).toBe("a");
    expect(output).toContain("Agregada: Lima.");
    expect(output).not.toContain("establecida como default");
    expect(await readJson<CitiesData>(paths.cities)).toEqual({
      defaultCityId: "a",
      cities: result.cities,
    });
  });

  test("omite los campos opcionales ausentes", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Lima", latitude: -12.04, longitude: -77.03 }] }),
    );
    const config = makeConfig();
    const prompt = createFakePrompt(["Lima", "1"]);

    const { result } = await captureStdoutAsync(() => addCity(prompt, config, paths));
    const city = result.cities[0];

    expect(city).toBeDefined();
    expect(city && "admin1" in city).toBe(false);
    expect(city && "country" in city).toBe(false);
  });
});
