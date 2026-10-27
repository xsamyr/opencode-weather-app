import { describe, expect, test } from "bun:test";
import {
  describeWeatherCode,
  formatHumidity,
  formatTemperature,
  formatWind,
  placeLabel,
  unitSymbol,
} from "../../src/utils/format.ts";

describe("format", () => {
  test("traduce los códigos climáticos conocidos", () => {
    expect(describeWeatherCode(0)).toBe("Despejado");
    expect(describeWeatherCode(3)).toBe("Nublado");
    expect(describeWeatherCode(63)).toBe("Lluvia moderada");
    expect(describeWeatherCode(95)).toBe("Tormenta eléctrica");
  });

  test("indica los códigos climáticos desconocidos", () => {
    expect(describeWeatherCode(999)).toBe("Condición desconocida (999)");
    expect(describeWeatherCode(-1)).toBe("Condición desconocida (-1)");
  });

  test("devuelve el símbolo de la unidad", () => {
    expect(unitSymbol("celsius")).toBe("°C");
    expect(unitSymbol("fahrenheit")).toBe("°F");
  });

  test("formatea la temperatura con un decimal", () => {
    expect(formatTemperature(12.34, "celsius")).toBe("12.3 °C");
    expect(formatTemperature(100, "fahrenheit")).toBe("100.0 °F");
    expect(formatTemperature(-5.06, "celsius")).toBe("-5.1 °C");
  });

  test("formatea la humedad redondeada", () => {
    expect(formatHumidity(54.4)).toBe("54 %");
    expect(formatHumidity(54.5)).toBe("55 %");
    expect(formatHumidity(0)).toBe("0 %");
  });

  test("formatea el viento con un decimal", () => {
    expect(formatWind(10)).toBe("10.0 km/h");
    expect(formatWind(4.26)).toBe("4.3 km/h");
  });

  test("compone la etiqueta del lugar", () => {
    expect(placeLabel({ name: "Ottawa", admin1: "Ontario", country: "Canadá" })).toBe(
      "Ottawa (Ontario, Canadá)",
    );
    expect(placeLabel({ name: "Madrid", admin1: "Madrid" })).toBe("Madrid (Madrid)");
    expect(placeLabel({ name: "Chile", country: "Chile" })).toBe("Chile (Chile)");
    expect(placeLabel({ name: "Lima", admin1: "", country: "" })).toBe("Lima");
  });
});
