import { runMenu } from "./presentation/menu.ts";
import { showError } from "./presentation/output.ts";
import { loadCities } from "./storage/citiesStorage.ts";
import { migrateLegacyConfig } from "./storage/migrate.ts";
import { loadSettings } from "./storage/settingsStorage.ts";
import type { Config } from "./types/Config.ts";
import { errorMessage } from "./utils/errors.ts";

async function loadConfig(): Promise<Config> {
  await migrateLegacyConfig();
  const citiesData = await loadCities();
  const settings = await loadSettings();
  return { ...citiesData, ...settings };
}

async function main(): Promise<void> {
  process.on("SIGINT", () => {
    process.stdout.write("\n  Hasta luego.\n");
    process.exit(0);
  });

  const config = await loadConfig();
  await runMenu(config);
}

try {
  await main();
} catch (error) {
  showError(errorMessage(error));
  process.exitCode = 1;
}
