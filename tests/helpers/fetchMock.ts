import { spyOn } from "bun:test";

export function installFetchMock(
  handler: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
) {
  return spyOn(globalThis, "fetch").mockImplementation(
    handler as unknown as typeof fetch,
  );
}

export function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export function requestedUrl(input: string | URL | Request): URL {
  if (input instanceof URL) {
    return input;
  }
  if (typeof input === "string") {
    return new URL(input);
  }
  return new URL(input.url);
}
