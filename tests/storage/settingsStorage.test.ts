import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import {
  createDefaultSettings,
  isUnit,
  loadSettings,
  saveSettings,
} from "../../src/storage/settingsStorage.ts";
import type { Settings } from "../../src/types/Config.ts";
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

describe("settingsStorage", () => {
  test("crea ajustes por defecto", () => {
    expect(createDefaultSettings()).toEqual({ unit: "celsius" });
  });

  test("valida las unidades", () => {
    expect(isUnit("celsius")).toBe(true);
    expect(isUnit("fahrenheit")).toBe(true);
    expect(isUnit("kelvin")).toBe(false);
    expect(isUnit(null)).toBe(false);
    expect(isUnit(1)).toBe(false);
  });

  test("devuelve los ajustes por defecto si no existe el archivo", async () => {
    const { paths } = currentTemp();
    expect(await loadSettings(paths)).toEqual(createDefaultSettings());
  });

  test("respalda ajustes inválidos", async () => {
    const { paths } = currentTemp();
    await writeFile(paths.settings, '{"unit":"kelvin"}', "utf8");

    expect(await loadSettings(paths)).toEqual(createDefaultSettings());
    expect(await fileExists(paths.settings)).toBe(false);
    expect(await fileExists(`${paths.settings}.bak`)).toBe(true);
  });

  test("lee ajustes válidos", async () => {
    const { paths } = currentTemp();
    const settings: Settings = { unit: "fahrenheit" };
    await writeFile(paths.settings, JSON.stringify(settings), "utf8");

    expect(await loadSettings(paths)).toEqual(settings);
  });

  test("guarda y recupera los ajustes", async () => {
    const { paths } = currentTemp();
    const settings: Settings = { unit: "fahrenheit" };

    await saveSettings(settings, paths);

    expect(await readJson<Settings>(paths.settings)).toEqual(settings);
    expect(await loadSettings(paths)).toEqual(settings);
  });
});
