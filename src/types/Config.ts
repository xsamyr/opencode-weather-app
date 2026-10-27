import type { City } from "./City.ts";

export type Unit = "celsius" | "fahrenheit";

export interface CitiesData {
  defaultCityId: string | null;
  cities: City[];
}

export interface Settings {
  unit: Unit;
}

export interface Config extends CitiesData, Settings {}
