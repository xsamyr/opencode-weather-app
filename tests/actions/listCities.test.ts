import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { listCities } from "../../src/actions/listCities.ts";
import { captureStdout } from "../helpers/captureOutput.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

const originalNoColor = process.env.NO_COLOR;

beforeEach(() => {
  process.env.NO_COLOR = "1";
});

afterEach(() => {
  if (originalNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = originalNoColor;
  }
});

describe("listCities", () => {
  test("lista las ciudades y marca la default", () => {
    const config = makeConfig({
      defaultCityId: "b",
      cities: [
        makeCity({ id: "a", name: "Ottawa", admin1: "Ontario", country: "Canadá" }),
        makeCity({ id: "b", name: "Lima", latitude: -12.04, longitude: -77.03 }),
      ],
    });
    const output = captureStdout();

    try {
      listCities(config);
    } finally {
      output.restore();
    }

    expect(output.text()).toBe(
      "\n  Ciudades guardadas:\n  1. Ottawa (Ontario, Canadá)\n  2. Lima *\n",
    );
  });
});
