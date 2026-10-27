import { createInterface } from "node:readline/promises";

export interface Prompt {
  ask(question: string): Promise<string>;
  close(): void;
}

export function createPrompt(): Prompt {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let closing = false;

  rl.on("close", () => {
    if (!closing) {
      process.stdout.write("\n  Hasta luego.\n");
      process.exit(0);
    }
  });

  return {
    ask: (question) => rl.question(question),
    close: () => {
      closing = true;
      rl.close();
    },
  };
}

export function parseIndex(input: string, length: number): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number.parseInt(trimmed, 10);
  if (value < 1 || value > length) {
    return null;
  }
  return value - 1;
}

export async function askConfirmation(prompt: Prompt, question: string): Promise<boolean> {
  const answer = (await prompt.ask(question)).trim().toLowerCase();
  return answer === "s";
}
