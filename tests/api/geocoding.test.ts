import { afterEach, describe, expect, test } from "bun:test";
import { searchCities } from "../../src/api/geocoding.ts";
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

describe("searchCities", () => {
  test("consulta la API y mapea los resultados", async () => {
    fetchMock = installFetchMock(async () =>
      jsonResponse({
        results: [
          {
            name: "Ottawa",
            latitude: 45.41117,
            longitude: -75.69812,
            admin1: "Ontario",
            country: "Canadá",
          },
          { name: "Lima", latitude: -12.04, longitude: -77.03 },
          { name: "Inválida", latitude: "45", longitude: 0 },
          null,
          { name: "Sin coordenadas" },
        ],
      }),
    );

    const results = await searchCities("Ottawa");
    const url = firstFetchUrl(fetchMock);

    expect(url.origin).toBe("https://geocoding-api.open-meteo.com");
    expect(url.pathname).toBe("/v1/search");
    expect(url.searchParams.get("name")).toBe("Ottawa");
    expect(url.searchParams.get("count")).toBe("5");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("format")).toBe("json");
    expect(results).toEqual([
      {
        name: "Ottawa",
        latitude: 45.41117,
        longitude: -75.69812,
        admin1: "Ontario",
        country: "Canadá",
      },
      { name: "Lima", latitude: -12.04, longitude: -77.03 },
    ]);
  });

  test("devuelve una lista vacía si no hay resultados", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({ results: [] }));

    expect(await searchCities("Ninguna")).toEqual([]);
  });

  test("devuelve una lista vacía si la respuesta no tiene results", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({}));

    expect(await searchCities("Ottawa")).toEqual([]);
  });

  test("devuelve una lista vacía si la respuesta no es un objeto", async () => {
    fetchMock = installFetchMock(async () => jsonResponse([]));

    expect(await searchCities("Ottawa")).toEqual([]);
  });

  test("lanza un error cuando la API responde con error", async () => {
    fetchMock = installFetchMock(async () => jsonResponse({}, { status: 500 }));

    await expect(searchCities("Ottawa")).rejects.toThrow(
      "La búsqueda de ciudades respondió con estado 500.",
    );
  });

  test("propaga los errores de red", async () => {
    fetchMock = installFetchMock(async () => {
      throw new Error("sin conexión");
    });

    await expect(searchCities("Ottawa")).rejects.toThrow("sin conexión");
  });
});
