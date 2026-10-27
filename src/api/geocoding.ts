import type { GeocodingResult } from "../types/City.ts";
import { GEOCODING_RESULT_COUNT, GEOCODING_URL, REQUEST_TIMEOUT_MS } from "../utils/constants.ts";
import { isRecord } from "../utils/errors.ts";

function toGeocodingResult(value: unknown): GeocodingResult | null {
  if (!isRecord(value)) {
    return null;
  }
  const { name, latitude, longitude } = value;
  if (typeof name !== "string" || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  const result: GeocodingResult = { name, latitude, longitude };
  if (typeof value.admin1 === "string") {
    result.admin1 = value.admin1;
  }
  if (typeof value.country === "string") {
    result.country = value.country;
  }
  return result;
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(GEOCODING_RESULT_COUNT));
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`La búsqueda de ciudades respondió con estado ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    return [];
  }

  const results: GeocodingResult[] = [];
  for (const item of payload.results) {
    const result = toGeocodingResult(item);
    if (result) {
      results.push(result);
    }
  }
  return results;
}
