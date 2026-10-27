const ANSI = {
  reset: "\x1B[0m",
  cyan: "\x1B[36m",
  yellow: "\x1B[33m",
  green: "\x1B[32m",
  red: "\x1B[31m",
} as const;

type Color = keyof typeof ANSI;

function colorsEnabled(): boolean {
  if ("NO_COLOR" in process.env) {
    return false;
  }
  return Boolean(process.stdout.isTTY);
}

export function paint(text: string, color: Color): string {
  if (!colorsEnabled()) {
    return text;
  }
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

export function cyan(text: string): string {
  return paint(text, "cyan");
}

export function yellow(text: string): string {
  return paint(text, "yellow");
}

export function green(text: string): string {
  return paint(text, "green");
}

export function red(text: string): string {
  return paint(text, "red");
}
