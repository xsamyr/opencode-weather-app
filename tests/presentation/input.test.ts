import { describe, expect, test } from "bun:test";
import { askConfirmation, parseIndex } from "../../src/presentation/input.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";

describe("parseIndex", () => {
  test("convierte índices válidos a base cero", () => {
    expect(parseIndex("1", 3)).toBe(0);
    expect(parseIndex("2", 3)).toBe(1);
    expect(parseIndex("3", 3)).toBe(2);
    expect(parseIndex(" 2 ", 3)).toBe(1);
    expect(parseIndex("03", 3)).toBe(2);
  });

  test("rechaza entradas inválidas", () => {
    expect(parseIndex("", 3)).toBeNull();
    expect(parseIndex("   ", 3)).toBeNull();
    expect(parseIndex("0", 3)).toBeNull();
    expect(parseIndex("4", 3)).toBeNull();
    expect(parseIndex("-1", 3)).toBeNull();
    expect(parseIndex("1.5", 3)).toBeNull();
    expect(parseIndex("1a", 3)).toBeNull();
    expect(parseIndex("abc", 3)).toBeNull();
    expect(parseIndex("Infinity", 3)).toBeNull();
    expect(parseIndex("1", 0)).toBeNull();
  });
});

describe("askConfirmation", () => {
  test("acepta s en cualquier combinación de mayúsculas y espacios", async () => {
    for (const answer of ["s", "S", " s "]) {
      const prompt = createFakePrompt([answer]);
      expect(await askConfirmation(prompt, "¿Continuar? ")).toBe(true);
      expect(prompt.questions).toEqual(["¿Continuar? "]);
    }
  });

  test("rechaza cualquier otra respuesta", async () => {
    for (const answer of ["n", "si", "", "no "]) {
      const prompt = createFakePrompt([answer]);
      expect(await askConfirmation(prompt, "¿Continuar? ")).toBe(false);
    }
  });
});
