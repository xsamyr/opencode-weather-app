import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  backupFile,
  fileExists as appFileExists,
  isMissingFileError,
  readJsonFile,
  writeJsonFile,
} from "../../src/storage/jsonFile.ts";
import { createTempStorage, fileExists as pathExists, type TempStorage } from "../helpers/tempStorage.ts";

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

describe("jsonFile", () => {
  test("detecta errores de archivo inexistente", () => {
    expect(isMissingFileError({ code: "ENOENT" })).toBe(true);
    expect(isMissingFileError({ code: "EACCES" })).toBe(false);
    expect(isMissingFileError(new Error("otro"))).toBe(false);
    expect(isMissingFileError(null)).toBe(false);
  });

  test("comprueba la existencia de archivos", async () => {
    const { root } = currentTemp();
    const path = join(root, "archivo.txt");

    expect(await appFileExists(path)).toBe(false);
    await writeFile(path, "contenido", "utf8");
    expect(await appFileExists(path)).toBe(true);
  });

  test("devuelve undefined cuando el archivo no existe", async () => {
    const { root } = currentTemp();
    expect(await readJsonFile(join(root, "no-existe.json"))).toBeUndefined();
  });

  test("propaga errores de acceso distintos de ENOENT", async () => {
    await expect(appFileExists("\0")).rejects.toThrow();
  });

  test("propaga errores de lectura distintos de ENOENT", async () => {
    const { root } = currentTemp();
    await expect(readJsonFile(root)).rejects.toThrow();
  });

  test("lee JSON válido y elimina el BOM", async () => {
    const { root } = currentTemp();
    const path = join(root, "con-bom.json");
    await writeFile(path, '\uFEFF{"ok":true}', "utf8");

    expect(await readJsonFile(path)).toEqual({ ok: true });
  });

  test("respalda y descarta JSON inválido", async () => {
    const { root } = currentTemp();
    const path = join(root, "invalido.json");
    await writeFile(path, "{no-es-json", "utf8");

    expect(await readJsonFile(path)).toBeUndefined();
    expect(await pathExists(path)).toBe(false);
    expect(await pathExists(`${path}.bak`)).toBe(true);
    expect(await readFile(`${path}.bak`, "utf8")).toBe("{no-es-json");
  });

  test("escribe JSON con formato, salto de línea y sin temporales", async () => {
    const { root } = currentTemp();
    const path = join(root, "anidado", "datos.json");

    await writeJsonFile(path, { nombre: "Ottawa", valor: 1 });

    expect(await pathExists(path)).toBe(true);
    expect(await pathExists(`${path}.tmp`)).toBe(false);
    const raw = await readFile(path, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(JSON.parse(raw)).toEqual({ nombre: "Ottawa", valor: 1 });

    await writeJsonFile(path, { nombre: "Toronto" });
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ nombre: "Toronto" });
  });

  test("renombra archivos existentes al respaldarlos", async () => {
    const { root } = currentTemp();
    const path = join(root, "respaldo.json");
    await writeFile(path, "original", "utf8");

    await backupFile(path);

    expect(await pathExists(path)).toBe(false);
    expect(await readFile(`${path}.bak`, "utf8")).toBe("original");
  });

  test("ignora el respaldo de un archivo inexistente", async () => {
    const { root } = currentTemp();
    const path = join(root, "inexistente.json");

    await expect(backupFile(path)).resolves.toBeUndefined();
    expect(await pathExists(`${path}.bak`)).toBe(false);
  });
});
