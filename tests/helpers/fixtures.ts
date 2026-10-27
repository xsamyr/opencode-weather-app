import type { City } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";

export function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: "city-1",
    name: "Ottawa",
    latitude: 45.41117,
    longitude: -75.69812,
    ...overrides,
  };
}

export function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    defaultCityId: null,
    cities: [],
    unit: "celsius",
    ...overrides,
  };
}
