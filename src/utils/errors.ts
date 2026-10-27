export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") {
      return "La solicitud tardó demasiado tiempo.";
    }
    if (error instanceof TypeError) {
      return "No se pudo conectar con el servicio del clima.";
    }
    return error.message;
  }
  return String(error);
}
