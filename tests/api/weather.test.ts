import { afterEach, describe, expect, test } from "bun:test";
import { fetchWeather } from "../../src/api/weather.ts";
import { makeCity } from "../helpers/fixtures.ts";
import { installFetchMock, jsonResponse, requestedUrl } from "../helpers/fetchMock.ts";

type FetchMock = ReturnType<typeof installFetchMock>;

let fetchMock: FetchMock | undefined;

afterEach(() => {
  fetchMock?.mockRestore();
  fetchMock = undefined;
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
  weather_code: 2,
  wind_speed_10m: 12.7,
};

describe("fetchWeather", () => {
  test("consulta el pronóstico y mapea los datos actuales", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({ current }));

    const weather = await fetchWeather(makeCity(), "celsius");
    const url = firstFetchUrl(fetchMock);

    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.pathname).toBe("/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("longitude")).toBe("-75.69812");
    expect(url.searchParams.get("current")).toBe(
      "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    );
    expect(url.searchParams.get("temperature_unit")).toBe("celsius");
    expect(weather).toEqual({
      temperature: 18.4,
      humidity: 63,
      weatherCode: 2,
      windSpeed: 12.7,
    });
  });

  test("envía la unidad Fahrenheit", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({ current }));

    await fetchWeather(makeCity(), "fahrenheit");

    expect(firstFetchUrl(fetchMock).searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("lanza un error cuando el servicio responde con error", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({}, { status: 503 }));

    await expect(fetchWeather(makeCity(), "celsius")).rejects.toThrow(
      "El servicio del clima respondió con estado 503.",
    );
  });

  test("lanza un error si la respuesta no es un objeto", async () => {
    fetchMock = installFetchMock(async () => jsonResponse(null));

    await expect(fetchWeather(makeCity(), "celsius")).rejects.toThrow(
      "La respuesta del clima es inválida.",
    );
  });

  test("lanza un error si faltan los datos actuales", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({}));

    await expect(fetchWeather(makeCity(), "celsius")).rejects.toThrow(
      "La respuesta del clima no incluye los datos esperados.",
    );
  });

  test("lanza un error si algún dato actual tiene un tipo inválido", async () => {
    fetchMock = installFetchMock(async () =>
      jsonResponse({ current: { ...current, relative_humidity_2m: "63" } }),
    );

    await expect(fetchWeather(makeCity(), "celsius")).rejects.toThrow(
      "La respuesta del clima no incluye los datos esperados.",
    );
  });
});
