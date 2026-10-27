import type { City } from "./City.ts";

export interface Weather {
  temperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
}

export interface WeatherTableRow {
  city: City;
  weather?: Weather;
  error?: string;
}
