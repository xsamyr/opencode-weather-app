import { spyOn } from "bun:test";

export interface CapturedOutput {
  chunks: string[];
  text(): string;
  restore(): void;
}

export function captureStdout(): CapturedOutput {
  const chunks: string[] = [];
  const spy = spyOn(process.stdout, "write").mockImplementation(
    ((chunk: string | Uint8Array) => {
      chunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write,
  );

  return {
    chunks,
    text: () => chunks.join(""),
    restore: () => spy.mockRestore(),
  };
}

export async function captureStdoutAsync<T>(
  callback: () => Promise<T>,
): Promise<{ result: T; output: string }> {
  const capture = captureStdout();
  try {
    const result = await callback();
    return { result, output: capture.text() };
  } finally {
    capture.restore();
  }
}
