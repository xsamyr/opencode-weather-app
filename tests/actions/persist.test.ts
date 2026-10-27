import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { persistCities, persistSettings } from "../../src/actions/persist.ts";
import type { StoragePaths } from "../../src/utils/constants.ts";
import { captureStdout } from "../helpers/captureOutput.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";
import { createTempStorage, type TempStorage } from "../helpers/tempStorage.ts";

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

async function blockedPaths(): Promise<StoragePaths> {
  const { root } = currentTemp();
  const blocker = join(root, "bloqueo");
  await writeFile(blocker, "archivo", "utf8");
  return {
    cities: join(blocker, "cities.json"),
    settings: join(blocker, "settings.json"),
    legacy: join(blocker, "legacy.json"),
  };
}

describe("persist", () => {
  test("muestra el error de ciudades sin lanzar la excepción", async () => {
    const paths = await blockedPaths();
    const config = makeConfig({
      defaultCityId: "a",
      cities: [makeCity({ id: "a" })],
    });
    const output = captureStdout();

    try {
      await persistCities(config, paths);
    } finally {
      output.restore();
    }

    expect(output.text()).toContain("No se pudo guardar la configuración:");
  });

  test("muestra el error de ajustes sin lanzar la excepción", async () => {
    const paths = await blockedPaths();
    const config = makeConfig({ unit: "fahrenheit" });
    const output = captureStdout();

    try {
      await persistSettings(config, paths);
    } finally {
      output.restore();
    }

    expect(output.text()).toContain("No se pudo guardar la configuración:");
  });
});
