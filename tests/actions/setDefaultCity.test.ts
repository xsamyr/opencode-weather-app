import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";
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

describe("setDefaultCity", () => {
  test("informa cuando no hay ciudades guardadas", async () => {
    const { paths } = currentTemp();
    const config = makeConfig();
    const prompt = createFakePrompt([]);

    const { result, output } = await captureStdoutAsync(() =>
      setDefaultCity(prompt, config, paths),
    );

    expect(result).toBe(config);
    expect(prompt.questions).toEqual([]);
    expect(output).toContain("No hay ciudades guardadas. Agrega una con la opción 3.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("cancela con Enter", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt([""]);

    const { result, output } = await captureStdoutAsync(() =>
      setDefaultCity(prompt, config, paths),
    );

    expect(result.defaultCityId).toBe("a");
    expect(output).toContain("Operación cancelada.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("rechaza una selección inválida", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt(["0"]);

    const { result, output } = await captureStdoutAsync(() =>
      setDefaultCity(prompt, config, paths),
    );

    expect(result.defaultCityId).toBe("a");
    expect(output).toContain("Selección inválida.");
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("establece y persiste la ciudad default", async () => {
    const { paths } = currentTemp();
    const config = sampleConfig();
    const prompt = createFakePrompt(["2"]);

    const { result, output } = await captureStdoutAsync(() =>
      setDefaultCity(prompt, config, paths),
    );

    expect(result.defaultCityId).toBe("b");
    expect(output).toContain("Ciudad default: Lima.");
    expect(await readJson<CitiesData>(paths.cities)).toEqual({
      defaultCityId: "b",
      cities: result.cities,
    });
  });
});
