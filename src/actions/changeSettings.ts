import type { Prompt } from "../presentation/input.ts";
import { askConfirmation } from "../presentation/input.ts";
import { showInfo, showSuccess } from "../presentation/output.ts";
import type { Config, Unit } from "../types/Config.ts";
import { getStoragePaths, type StoragePaths } from "../utils/constants.ts";
import { unitSymbol } from "../utils/format.ts";
import { persistSettings } from "./persist.ts";

export async function changeSettings(
  prompt: Prompt,
  config: Config,
  paths: StoragePaths = getStoragePaths(),
): Promise<Config> {
  const nextUnit: Unit = config.unit === "celsius" ? "fahrenheit" : "celsius";

  showInfo(`  Unidad actual: ${unitSymbol(config.unit)}.`);
  const confirmed = await askConfirmation(prompt, `  ¿Cambiar a ${unitSymbol(nextUnit)}? (s/n): `);
  if (!confirmed) {
    showInfo("  Sin cambios.");
    return config;
  }

  config.unit = nextUnit;
  await persistSettings(config, paths);
  showSuccess(`  Unidad establecida en ${unitSymbol(nextUnit)}.`);
  return config;
}
