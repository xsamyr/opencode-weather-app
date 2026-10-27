import type { Config } from "../types/Config.ts";
import { renderCityList, showInfo } from "../presentation/output.ts";

export function listCities(config: Config): void {
  showInfo("\n  Ciudades guardadas:");
  renderCityList(config.cities, config.defaultCityId);
}
