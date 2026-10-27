import { describe, expect, test } from "bun:test";
import { errorMessage, isRecord } from "../../src/utils/errors.ts";

describe("errors", () => {
  test("identifica registros y descarta otros valores", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ value: 1 })).toBe(true);
    expect(isRecord(new Date())).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("texto")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  test("traduce los timeouts", () => {
    const error = new Error("tiempo agotado");
    error.name = "TimeoutError";
    expect(errorMessage(error)).toBe("La solicitud tardó demasiado tiempo.");
  });

  test("traduce los errores de conexión", () => {
    expect(errorMessage(new TypeError("fetch failed"))).toBe(
      "No se pudo conectar con el servicio del clima.",
    );
  });

  test("devuelve el mensaje de errores normales", () => {
    expect(errorMessage(new Error("algo falló"))).toBe("algo falló");
  });

  test("convierte valores que no son errores a texto", () => {
    expect(errorMessage("fallo")).toBe("fallo");
    expect(errorMessage(42)).toBe("42");
    expect(errorMessage(null)).toBe("null");
  });
});
