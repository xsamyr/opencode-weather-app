import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  renderCityList,
  renderWeather,
  renderWeatherTable,
  showError,
  showInfo,
  showSuccess,
} from "../../src/presentation/output.ts";
import type { WeatherTableRow } from "../../src/types/Weather.ts";
import { captureStdout } from "../helpers/captureOutput.ts";
import { makeCity } from "../helpers/fixtures.ts";

const originalNoColor = process.env.NO_COLOR;

beforeEach(() => {
  process.env.NO_COLOR = "1";
});

afterEach(() => {
  if (originalNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = originalNoColor;
  }
});

describe("output", () => {
  test("muestra mensajes informativos, de éxito y de error", () => {
    const output = captureStdout();
    try {
      showInfo("info");
      showSuccess("éxito");
      showError("fallo");
    } finally {
      output.restore();
    }

    expect(output.text()).toBe("info\néxito\n  Error: fallo\n");
  });

  test("lista las ciudades y marca la default", () => {
    const output = captureStdout();
    const cities = [
      makeCity({ id: "a", name: "Ottawa", admin1: "Ontario", country: "Canadá" }),
      makeCity({ id: "b", name: "Toronto", admin1: "Ontario", country: "Canadá" }),
    ];

    try {
      renderCityList(cities, "b");
    } finally {
      output.restore();
    }

    expect(output.text()).toBe(
      "  1. Ottawa (Ontario, Canadá)\n  2. Toronto (Ontario, Canadá) *\n",
    );
  });

  test("renderiza el clima individual", () => {
    const output = captureStdout();
    const city = makeCity({ name: "Ottawa", admin1: "Ontario", country: "Canadá" });

    try {
      renderWeather(
        city,
        { temperature: 12.34, humidity: 54.4, weatherCode: 0, windSpeed: 10 },
        "celsius",
      );
    } finally {
      output.restore();
    }

    const text = output.text();
    expect(text).toContain("Ottawa (Ontario, Canadá)");
    expect(text).toContain("Condición:   Despejado");
    expect(text).toContain("Temperatura: 12.3 °C");
    expect(text).toContain("Humedad:     54 %");
    expect(text).toContain("Viento:      10.0 km/h");
  });

  test("indica cuando no hay filas para la tabla", () => {
    const output = captureStdout();
    try {
      renderWeatherTable([], "celsius");
    } finally {
      output.restore();
    }

    expect(output.text()).toBe("  No hay ciudades guardadas.\n");
  });

  test("renderiza filas correctas y errores en la tabla", () => {
    const output = captureStdout();
    const rows: WeatherTableRow[] = [
      {
        city: makeCity({ id: "a", name: "Ottawa" }),
        weather: { temperature: 12.34, humidity: 54.4, weatherCode: 0, windSpeed: 10 },
      },
      {
        city: makeCity({ id: "b", name: "Toronto" }),
        error: "servicio caído",
      },
    ];

    try {
      renderWeatherTable(rows, "celsius");
    } finally {
      output.restore();
    }

    const text = output.text();
    expect(text).toContain("Ciudad");
    expect(text).toContain("Temp.");
    expect(text).toContain("Condición");
    expect(text).toContain("Humedad");
    expect(text).toContain("Viento");
    expect(text).toContain("Ottawa");
    expect(text).toContain("12.3 °C");
    expect(text).toContain("Despejado");
    expect(text).toContain("Toronto");
    expect(text).toContain("Error: servicio caído");
  });
});
