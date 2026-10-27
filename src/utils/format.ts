import type { Unit } from "../types/Config.ts";

const WEATHER_CODES: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta eléctrica",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso",
};

interface PlaceLike {
  name: string;
  admin1?: string;
  country?: string;
}

export function describeWeatherCode(code: number): string {
  return WEATHER_CODES[code] ?? `Condición desconocida (${code})`;
}

export function unitSymbol(unit: Unit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

export function formatTemperature(value: number, unit: Unit): string {
  return `${value.toFixed(1)} ${unitSymbol(unit)}`;
}

export function formatHumidity(value: number): string {
  return `${Math.round(value)} %`;
}

export function formatWind(value: number): string {
  return `${value.toFixed(1)} km/h`;
}

export function placeLabel(place: PlaceLike): string {
  const region = [place.admin1, place.country]
    .filter((part): part is string => Boolean(part))
    .join(", ");
  return region.length > 0 ? `${place.name} (${region})` : place.name;
}
