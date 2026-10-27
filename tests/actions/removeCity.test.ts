import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { removeCity } from "../../src/actions/removeCity.ts";
import type { CitiesData } from "../../src/types/Config.ts";
import { captureStdoutAsync } from "../helpers/captureOutput.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";
import {
  createTempStorage,
  fileExists,
  readJson,
  type TempStorage,
} from "../helpers/tempStorage.ts";

const originalNoColor = process.env.NO_COLOR;

let temp: TempStorage | undefined;

beforeEach(async () => {
  process.env.NO_COLOR = "1";
  temp = await createTempStorage();
});

afterEach(async () => {
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

function sampleConfig(): ReturnType<typeof makeConfig> {
  return makeConfig({
    defaultCityId: "a",
    cities: [
      makeCity({ id: "a", name: "Ottawa" }),
      makeCity({ id: "b", name: "Lima", latitude: -12.04, longitude: -77.03 }),
    ],
  });
}

describe("removeCity", () => {
  test("informa cuando no hay ciudades", async () => {
    const { paths } = currentTemp();
    const config = makeConfig();
    const prompt = createFakePrompt([]);

    const { result, output } = await captureStdoutAsync(() => removeCity(prompt, config, paths));

    expect(result).toBe(config);
    expect(prompt.questions).toEqual([]);
    expect(output).toContain("No hay ciudades para eliminar.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("cancela con Enter", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt([""]);

    const { result, output } = await captureStdoutAsync(() => removeCity(prompt, config, paths));

    expect(result.cities).toHaveLength(2);
    expect(output).toContain("Operación cancelada.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("rechaza una selección inválida", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt(["9"]);

    const { result, output } = await captureStdoutAsync(() => removeCity(prompt, config, paths));

    expect(result.cities).toHaveLength(2);
    expect(output).toContain("Selección inválida.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("no elimina si el usuario no confirma", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt(["1", "n"]);

    const { result, output } = await captureStdoutAsync(() => removeCity(prompt, config, paths));

    expect(result.cities).toHaveLength(2);
    expect(output).toContain("Operación cancelada.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("elimina una ciudad y persiste los cambios", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt(["2", "s"]);

    const { result, output } = await captureStdoutAsync(() => removeCity(prompt, config, paths));

    expect(result.cities.map((city) => city.id)).toEqual(["a"]);
    expect(result.defaultCityId).toBe("a");
    expect(output).toContain("Eliminada: Lima.");
    expect(await readJson<CitiesData>(paths.cities)).toEqual({
      defaultCityId: "a",
      cities: result.cities,
    });
  });

  test("limpia el default cuando se elimina esa ciudad", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt(["1", "S"]);

    const { result, output } = await captureStdoutAsync(() => removeCity(prompt, config, paths));

    expect(result.cities.map((city) => city.id)).toEqual(["b"]);
    expect(result.defaultCityId).toBeNull();
    expect(output).toContain("La ciudad default quedó sin asignar.");
    expect(await readJson<CitiesData>(paths.cities)).toEqual({
      defaultCityId: null,
      cities: result.cities,
    });
  });
});
