import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cyan, green, paint, red, yellow } from "../../src/utils/colors.ts";

const originalNoColor = process.env.NO_COLOR;
const originalTty = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");

function setTty(value: boolean): void {
  Object.defineProperty(process.stdout, "isTTY", { value, configurable: true });
}

function restoreTty(): void {
  if (originalTty) {
    Object.defineProperty(process.stdout, "isTTY", originalTty);
    return;
  }
  delete (process.stdout as { isTTY?: boolean }).isTTY;
}

beforeEach(() => {
  delete process.env.NO_COLOR;
  setTty(false);
});

afterEach(() => {
  if (originalNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = originalNoColor;
  }
  restoreTty();
});

describe("colors", () => {
  test("no colorea cuando la salida no es una TTY", () => {
    expect(paint("texto", "cyan")).toBe("texto");
    expect(cyan("texto")).toBe("texto");
  });

  test("respeta NO_COLOR incluso en una TTY", () => {
    setTty(true);
    process.env.NO_COLOR = "";
    expect(cyan("texto")).toBe("texto");
    expect(yellow("texto")).toBe("texto");
  });

  test("aplica colores ANSI cuando la salida es una TTY", () => {
    setTty(true);
    expect(cyan("texto")).toBe("\x1B[36mtexto\x1B[0m");
    expect(yellow("texto")).toBe("\x1B[33mtexto\x1B[0m");
    expect(green("texto")).toBe("\x1B[32mtexto\x1B[0m");
    expect(red("texto")).toBe("\x1B[31mtexto\x1B[0m");
  });
});
