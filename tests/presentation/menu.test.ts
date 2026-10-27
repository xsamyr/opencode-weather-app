import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { renderMenu, runMenu } from "../../src/presentation/menu.ts";
import type { CitiesData, Settings } from "../../src/types/Config.ts";
import { captureStdout, captureStdoutAsync } from "../helpers/captureOutput.ts";
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
const originalTty = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");

type FetchMock = ReturnType<typeof installFetchMock>;

let temp: TempStorage | undefined;
let fetchMock: FetchMock | undefined;

beforeEach(async () => {
  process.env.NO_COLOR = "1";
  Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
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
  if (originalTty) {
    Object.defineProperty(process.stdout, "isTTY", originalTty);
  } else {
    delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
});

function currentTemp(): TempStorage {
  if (!temp) {
    throw new Error("El almacenamiento temporal no está inicializado.");
  }
  return temp;
}

function configWithCity(): ReturnType<typeof makeConfig> {
  return makeConfig({
    defaultCityId: "a",
    cities: [makeCity({ id: "a", name: "Ottawa" })],
  });
}

function configWithTwoCities(): ReturnType<typeof makeConfig> {
  return makeConfig({
    defaultCityId: "a",
    cities: [
      makeCity({ id: "a", name: "Ottawa" }),
      makeCity({ id: "b", name: "Lima", latitude: -12.04, longitude: -77.03 }),
    ],
  });
}

const currentWeather = {
  temperature_2m: 18.4,
  relative_humidity_2m: 63,
  weather_code: 0,
  wind_speed_10m: 12.7,
};

describe("renderMenu", () => {
  test("muestra las opciones, la cantidad de ciudades y la unidad", () => {
    const output = captureStdout();

    try {
      renderMenu(2, "fahrenheit");
    } finally {
      output.restore();
    }

    const text = output.text();
    expect(text).toContain("WEATHER CLI");
    expect(text).toContain("1. Clima de ciudad default");
    expect(text).toContain("2. Clima de todas las ciudades (2)");
    expect(text).toContain("8. Ajustes (°F)");
    expect(text).toContain("9. Salir");
    expect(text).not.toContain("\x1B[2J");
  });

  test("limpia la pantalla cuando la salida es interactiva", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    const output = captureStdout();

    try {
      renderMenu(0, "celsius");
    } finally {
      output.restore();
    }

    expect(output.text().startsWith("\x1B[2J\x1B[H")).toBe(true);
  });
});

describe("runMenu", () => {
  test("sale con la opción 9 y cierra el prompt", async () => {
    const { paths } = currentTemp();
    const config = configWithCity();
    const prompt = createFakePrompt(["9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Hasta luego.");
    expect(prompt.closeCalls).toBe(1);
  });

  test("ofrece agregar una ciudad cuando no hay ninguna", async () => {
    const { paths } = currentTemp();
    const config = makeConfig();
    const prompt = createFakePrompt(["n", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Bienvenido a Weather CLI. Aún no tienes ciudades guardadas.");
    expect(output).toContain("Hasta luego.");
    expect(prompt.questions).toHaveLength(2);
    expect(await fileExists(paths.cities)).toBe(false);
  });

  test("agrega una ciudad desde la bienvenida y persiste", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Ottawa", latitude: 45.4, longitude: -75.7 }] }),
    );
    const config = makeConfig();
    const prompt = createFakePrompt(["s", "Ottawa", "1", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Bienvenido a Weather CLI. Aún no tienes ciudades guardadas.");
    expect(output).toContain("Agregada: Ottawa");
    const saved = await readJson<CitiesData>(paths.cities);
    expect(saved.cities).toHaveLength(1);
    expect(saved.defaultCityId).toBe(saved.cities[0]?.id ?? null);
  });

  test("ejecuta la opción 1 y muestra el clima default", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () => jsonResponse({ current: currentWeather }));
    const config = configWithCity();
    const prompt = createFakePrompt(["1", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Ottawa");
    expect(output).toContain("18.4 °C");
  });

  test("ejecuta la opción 2 y muestra la tabla del clima", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () => jsonResponse({ current: currentWeather }));
    const config = configWithCity();
    const prompt = createFakePrompt(["2", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Consultando clima de 1 ciudad(es)...");
    expect(output).toContain("18.4 °C");
  });

  test("ejecuta la opción 3 y agrega una ciudad", async () => {
    const { paths } = currentTemp();
    fetchMock = installFetchMock(async () =>
      jsonResponse({ results: [{ name: "Lima", latitude: -12.04, longitude: -77.03 }] }),
    );
    const config = configWithCity();
    const prompt = createFakePrompt(["3", "Lima", "1", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Agregada: Lima.");
    const saved = await readJson<CitiesData>(paths.cities);
    expect(saved.cities.map((city) => city.name)).toEqual(["Ottawa", "Lima"]);
  });

  test("ejecuta la opción 4 y elimina una ciudad", async () => {
    const { paths } = currentTemp();
    const config = configWithTwoCities();
    const prompt = createFakePrompt(["4", "1", "s", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Eliminada: Ottawa.");
    const saved = await readJson<CitiesData>(paths.cities);
    expect(saved.cities.map((city) => city.id)).toEqual(["b"]);
  });

  test("ejecuta la opción 5 y cambia la ciudad default", async () => {
    const { paths } = currentTemp();
    const config = configWithTwoCities();
    const prompt = createFakePrompt(["5", "2", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Ciudad default: Lima.");
    expect(await readJson<CitiesData>(paths.cities)).toMatchObject({ defaultCityId: "b" });
  });

  test("informa una opción inválida y hace una pausa", async () => {
    const { paths } = currentTemp();
    const config = configWithCity();
    const prompt = createFakePrompt(["x", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Opción inválida.");
    expect(prompt.questions).toContain("\n  Presiona Enter para continuar...");
    expect(output).toContain("Hasta luego.");
  });

  test("ejecuta la opción de ajustes y persiste la unidad", async () => {
    const { paths } = currentTemp();
    const config = configWithCity();
    const prompt = createFakePrompt(["8", "s", "", "9"]);

    const { output } = await captureStdoutAsync(() => runMenu(config, paths, prompt));

    expect(output).toContain("Unidad establecida en °F.");
    expect(await readJson<Settings>(paths.settings)).toEqual({ unit: "fahrenheit" });
    expect(prompt.closeCalls).toBe(1);
  });
});
