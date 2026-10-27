import type { City } from "../types/City.ts";
import type { Unit } from "../types/Config.ts";
import type { Weather, WeatherTableRow } from "../types/Weather.ts";
import { cyan, green, red, yellow } from "../utils/colors.ts";
import {
  describeWeatherCode,
  formatHumidity,
  formatTemperature,
  formatWind,
  placeLabel,
} from "../utils/format.ts";

type CellPainter = (text: string) => string;

export function showInfo(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function showSuccess(message: string): void {
  process.stdout.write(`${green(message)}\n`);
}

export function showError(message: string): void {
  process.stdout.write(`${red(`  Error: ${message}`)}\n`);
}

export function renderCityList(cities: City[], defaultCityId: string | null): void {
  cities.forEach((city, index) => {
    const marker = city.id === defaultCityId ? green(" *") : "";
    process.stdout.write(`  ${index + 1}. ${placeLabel(city)}${marker}\n`);
  });
}

export function renderWeather(city: City, weather: Weather, unit: Unit): void {
  const lines = [
    "",
    `  ${cyan(placeLabel(city))}`,
    `  Condición:   ${describeWeatherCode(weather.weatherCode)}`,
    `  Temperatura: ${yellow(formatTemperature(weather.temperature, unit))}`,
    `  Humedad:     ${formatHumidity(weather.humidity)}`,
    `  Viento:      ${formatWind(weather.windSpeed)}`,
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

export function renderWeatherTable(rows: WeatherTableRow[], unit: Unit): void {
  if (rows.length === 0) {
    showInfo("  No hay ciudades guardadas.");
    return;
  }

  const headers = ["Ciudad", "Temp.", "Condición", "Humedad", "Viento"];
  const cells = rows.map((row) => {
    if (!row.weather) {
      return [
        placeLabel(row.city),
        "-",
        `Error: ${row.error ?? "desconocido"}`,
        "-",
        "-",
      ];
    }
    return [
      placeLabel(row.city),
      formatTemperature(row.weather.temperature, unit),
      describeWeatherCode(row.weather.weatherCode),
      formatHumidity(row.weather.humidity),
      formatWind(row.weather.windSpeed),
    ];
  });

  const widths = headers.map((header, column) =>
    Math.max(header.length, ...cells.map((row) => row[column]?.length ?? 0)),
  );

  const formatRow = (row: string[], painters: Partial<Record<number, CellPainter>> = {}): string => {
    const rendered = row.map((cell, column) => {
      const padded = cell.padEnd(widths[column] ?? 0);
      const paint = painters[column];
      return paint ? paint(padded) : padded;
    });
    return `  ${rendered.join("  ").trimEnd()}`;
  };

  const headerPainters: Partial<Record<number, CellPainter>> = {};
  headers.forEach((_, column) => {
    headerPainters[column] = cyan;
  });

  process.stdout.write("\n");
  process.stdout.write(`${formatRow(headers, headerPainters)}\n`);
  process.stdout.write(`  ${widths.map((width) => "─".repeat(width)).join("  ")}\n`);
  cells.forEach((values, index) => {
    const row = rows[index];
    if (!row) {
      return;
    }
    if (row.weather) {
      process.stdout.write(`${formatRow(values, { 1: yellow })}\n`);
    } else {
      process.stdout.write(`${formatRow(values, { 2: red })}\n`);
    }
  });
}
