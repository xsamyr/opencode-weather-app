import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getAllWeather, getDefaultWeather } from "../../src/actions/getWeather.ts";
import { captureStdoutAsync } from "../helpers/captureOutput.ts";
import { installFetchMock, jsonResponse, requestedUrl } from "../helpers/fetchMock.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

const originalNoColor = process.env.NO_COLOR;
type FetchMock = ReturnType<typeof installFetchMock>;

let fetchMock: FetchMock | undefined;

beforeEach(() => {
  process.env.NO_COLOR = "1";
});

afterEach(() => {
  fetchMock?.mockRestore();
  fetchMock = undefined;
  if (originalNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = originalNoColor;
  }
});

function firstFetchUrl(mock: FetchMock): URL {
  const call = mock.mock.calls[0];
  if (!call) {
    throw new Error("fetch no fue llamado.");
  }
  return requestedUrl(call[0]);
}

const current = {
  temperature_2m: 18.4,
  relative_humidity_2m: 63,
  weather_code: 0,
  wind_speed_10m: 12.7,
};

describe("getDefaultWeather", () => {
  test("informa si no hay ciudad default", async () => {
    const config = makeConfig({ cities: [makeCity({ id: "a" })], defaultCityId: null });

    const { output } = await captureStdoutAsync(() => getDefaultWeather(config));

    expect(output).toContain("No hay ciudad default.");
  });

  test("consulta y renderiza el clima de la ciudad default", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({ current }));
    const city = makeCity({ id: "a", name: "Ottawa" });
    const config = makeConfig({ cities: [city], defaultCityId: "a" });

    const { output } = await captureStdoutAsync(() => getDefaultWeather(config));
    const url = firstFetchUrl(fetchMock);

    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("longitude")).toBe("-75.69812");
    expect(output).toContain("Ottawa");
    expect(output).toContain("Despejado");
    expect(output).toContain("18.4 °C");
    expect(output).toContain("63 %");
  });

  test("muestra el error si falla la consulta", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({}, { status: 500 }));
    const config = makeConfig({ cities: [makeCity({ id: "a" })], defaultCityId: "a" });

    const { output } = await captureStdoutAsync(() => getDefaultWeather(config));

    expect(output).toContain("Error: El servicio del clima respondió con estado 500.");
  });
});

describe("getAllWeather", () => {
  test("informa cuando no hay ciudades guardadas", async () => {
    const config = makeConfig();

    const { output } = await captureStdoutAsync(() => getAllWeather(config));

    expect(output).toContain("No hay ciudades guardadas.");
  });

  test("consulta todas las ciudades y renderiza la tabla", async () => {
    fetchMock = installFetchMock(async (input) => {
      const url = requestedUrl(input);
      const temperature = url.searchParams.get("latitude") === "45.41117" ? 50 : 68;
      return jsonResponse({ current: { ...current, temperature_2m: temperature } });
    });
    const config = makeConfig({
      unit: "fahrenheit",
      cities: [
        makeCity({ id: "a", name: "Ottawa" }),
        makeCity({ id: "b", name: "Lima", latitude: -12.04, longitude: -77.03 }),
      ],
    });

    const { output } = await captureStdoutAsync(() => getAllWeather(config));

    expect(output).toContain("Consultando clima de 2 ciudad(es)...");
    expect(output).toContain("Ottawa");
    expect(output).toContain("Lima");
    expect(output).toContain("50.0 °F");
    expect(output).toContain("68.0 °F");
  });

  test("incluye los errores parciales en la tabla", async () => {
    fetchMock = installFetchMock(async (input) => {
      const url = requestedUrl(input);
      if (url.searchParams.get("latitude") === "45.41117") {
        throw new Error("sin conexión");
      }
      return jsonResponse({ current });
    });
    const config = makeConfig({
      cities: [
        makeCity({ id: "a", name: "Ottawa" }),
        makeCity({ id: "b", name: "Lima", latitude: -12.04, longitude: -77.03 }),
      ],
    });

    const { output } = await captureStdoutAsync(() => getAllWeather(config));

    expect(output).toContain("Error: sin conexión");
    expect(output).toContain("Lima");
    expect(output).toContain("18.4 °C");
  });
});
