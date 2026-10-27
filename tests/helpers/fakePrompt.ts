import type { Prompt } from "../../src/presentation/input.ts";

export interface FakePrompt extends Prompt {
  readonly questions: string[];
  readonly closeCalls: number;
}

export function createFakePrompt(answers: string[]): FakePrompt {
  const queue = [...answers];
  const questions: string[] = [];
  let closeCalls = 0;

  return {
    questions,
    get closeCalls() {
      return closeCalls;
    },
    async ask(question: string): Promise<string> {
      questions.push(question);
      const answer = queue.shift();
      if (answer === undefined) {
        throw new Error(`No hay respuesta simulada para: ${question}`);
      }
      return answer;
    },
    close() {
      closeCalls += 1;
    },
  };
}
