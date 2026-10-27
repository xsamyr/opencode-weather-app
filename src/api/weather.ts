import type { City } from "../types/City.ts";
import type { Unit } from "../types/Config.ts";
import type { Weather } from "../types/Weather.ts";
import { FORECAST_URL, REQUEST_TIMEOUT_MS } from "../utils/constants.ts";
import { isRecord } from "../utils/errors.ts";

function toWeather(value: unknown): Weather | null {
  if (!isRecord(value)) {
    return null;
  }
  const temperature = value.temperature_2m;
  const humidity = value.relative_humidity_2m;
  const weatherCode = value.weather_code;
  const windSpeed = value.wind_speed_10m;
  if (
    typeof temperature !== "number" ||
    typeof humidity !== "number" ||
    typeof weatherCode !== "number" ||
    typeof windSpeed !== "number"
  ) {
    return null;
  }
  return { temperature, humidity, weatherCode, windSpeed };
}

export async function fetchWeather(city: City, unit: Unit): Promise<Weather> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set("temperature_unit", unit);

  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`El servicio del clima respondió con estado ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error("La respuesta del clima es inválida.");
  }

  const weather = toWeather(payload.current);
  if (!weather) {
    throw new Error("La respuesta del clima no incluye los datos esperados.");
  }
  return weather;
}
