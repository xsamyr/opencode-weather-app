import { fetchWeather } from "../api/weather.ts";
import { renderWeather, renderWeatherTable, showError, showInfo } from "../presentation/output.ts";
import type { Config } from "../types/Config.ts";
import type { WeatherTableRow } from "../types/Weather.ts";
import { errorMessage } from "../utils/errors.ts";

export async function getDefaultWeather(config: Config): Promise<void> {
  const city = config.cities.find((candidate) => candidate.id === config.defaultCityId);
  if (!city) {
    showInfo("  No hay ciudad default. Usa la opción 3 para agregar una o la 5 para establecerla.");
    return;
  }

  try {
    const weather = await fetchWeather(city, config.unit);
    renderWeather(city, weather, config.unit);
  } catch (error) {
    showError(errorMessage(error));
  }
}

export async function getAllWeather(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    showInfo("  No hay ciudades guardadas.");
    return;
  }

  showInfo(`  Consultando clima de ${config.cities.length} ciudad(es)...`);

  const rows: WeatherTableRow[] = await Promise.all(
    config.cities.map(async (city): Promise<WeatherTableRow> => {
      try {
        const weather = await fetchWeather(city, config.unit);
        return { city, weather };
      } catch (error) {
        return { city, error: errorMessage(error) };
      }
    }),
  );

  renderWeatherTable(rows, config.unit);
}
