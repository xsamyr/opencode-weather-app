import { addCity } from "../actions/addCity.ts";
import { changeSettings } from "../actions/changeSettings.ts";
import { getAllWeather, getDefaultWeather } from "../actions/getWeather.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";
import type { Config, Unit } from "../types/Config.ts";
import type { MenuOption } from "../types/MenuOption.ts";
import { cyan } from "../utils/colors.ts";
import { getStoragePaths, MENU_LINE, type StoragePaths } from "../utils/constants.ts";
import { unitSymbol } from "../utils/format.ts";
import { askConfirmation, createPrompt, type Prompt } from "./input.ts";
import { showError, showInfo } from "./output.ts";

function isInteractive(): boolean {
  return Boolean(process.stdout.isTTY);
}

export function renderMenu(cityCount: number, unit: Unit): void {
  if (isInteractive()) {
    process.stdout.write("\x1B[2J\x1B[H");
  }

  const options: MenuOption[] = [
    { key: "1", label: "Clima de ciudad default" },
    { key: "2", label: `Clima de todas las ciudades (${cityCount})` },
    { key: "3", label: "Buscar y agregar ciudad" },
    { key: "4", label: "Eliminar ciudad" },
    { key: "5", label: "Establecer ciudad default" },
    { key: "8", label: `Ajustes (${unitSymbol(unit)})` },
    { key: "9", label: "Salir" },
  ];

  const lines = [
    cyan(MENU_LINE),
    cyan("         WEATHER CLI"),
    cyan(MENU_LINE),
    ...options.map((option) => `  ${cyan(option.key)}. ${option.label}`),
    cyan(MENU_LINE),
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

async function pause(prompt: Prompt): Promise<void> {
  await prompt.ask("\n  Presiona Enter para continuar...");
}

export async function runMenu(
  initialConfig: Config,
  paths: StoragePaths = getStoragePaths(),
  prompt: Prompt = createPrompt(),
): Promise<void> {
  let config = initialConfig;

  try {
    if (config.cities.length === 0) {
      showInfo("  Bienvenido a Weather CLI. Aún no tienes ciudades guardadas.");
      const answer = await askConfirmation(prompt, "  ¿Quieres agregar una ciudad ahora? (s/n): ");
      if (answer) {
        config = await addCity(prompt, config, paths);
        if (config.cities.length > 0) {
          await pause(prompt);
        }
      }
    }

    while (true) {
      renderMenu(config.cities.length, config.unit);
      const choice = (await prompt.ask("  Selecciona una opción: ")).trim();

      if (choice === "9") {
        showInfo("\n  Hasta luego.");
        break;
      }

      switch (choice) {
        case "1":
          await getDefaultWeather(config);
          break;
        case "2":
          await getAllWeather(config);
          break;
        case "3":
          config = await addCity(prompt, config, paths);
          break;
        case "4":
          config = await removeCity(prompt, config, paths);
          break;
        case "5":
          config = await setDefaultCity(prompt, config, paths);
          break;
        case "8":
          config = await changeSettings(prompt, config, paths);
          break;
        default:
          showError("Opción inválida.");
          break;
      }

      await pause(prompt);
    }
  } finally {
    prompt.close();
  }
}
