import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { changeSettings } from "../../src/actions/changeSettings.ts";
import type { Settings } from "../../src/types/Config.ts";
import { captureStdoutAsync } from "../helpers/captureOutput.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";
import { makeConfig } from "../helpers/fixtures.ts";
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

describe("changeSettings", () => {
  test("cambia de Celsius a Fahrenheit y persiste", async () => {
    const { paths } = currentTemp();
    const config = makeConfig({ unit: "celsius" });
    const prompt = createFakePrompt(["s"]);

    const { result, output } = await captureStdoutAsync(() =>
      changeSettings(prompt, config, paths),
    );

    expect(result.unit).toBe("fahrenheit");
    expect(output).toContain("Unidad actual: °C.");
    expect(output).toContain("Unidad establecida en °F.");
    expect(await readJson<Settings>(paths.settings)).toEqual({ unit: "fahrenheit" });
  });

  test("cambia de Fahrenheit a Celsius y persiste", async () => {
    const { paths } = currentTemp();
    const config = makeConfig({ unit: "fahrenheit" });
    const prompt = createFakePrompt(["S"]);

    const { result, output } = await captureStdoutAsync(() =>
      changeSettings(prompt, config, paths),
    );

    expect(result.unit).toBe("celsius");
    expect(output).toContain("Unidad establecida en °C.");
    expect(await readJson<Settings>(paths.settings)).toEqual({ unit: "celsius" });
  });

  test("no cambia la unidad si no se confirma", async () => {
    const { paths } = currentTemp();
    const config = makeConfig({ unit: "celsius" });
    const prompt = createFakePrompt(["n"]);

    const { result, output } = await captureStdoutAsync(() =>
      changeSettings(prompt, config, paths),
    );

    expect(result.unit).toBe("celsius");
    expect(output).toContain("Sin cambios.");
    expect(await fileExists(paths.settings)).toBe(false);
  });

  test("trata cualquier respuesta distinta de s como cancelación", async () => {
    const { paths } = currentTemp();
    const config = makeConfig({ unit: "fahrenheit" });
    const prompt = createFakePrompt(["si"]);

    const { result } = await captureStdoutAsync(() => changeSettings(prompt, config, paths));

    expect(result.unit).toBe("fahrenheit");
    expect(await fileExists(paths.settings)).toBe(false);
  });
});
