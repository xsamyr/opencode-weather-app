# AGENTS.md

## Project state

Weather CLI implemented in Bun. Entry point is `src/index.ts`. The app loads cities/settings from `~/.config/weather-cli/`, migrates the old `~/.weather-cli.json` automatically, and follows the two-step OpenMeteo flow: geocoding API first, then forecast API.

Source layout:

- `src/actions/` — user actions (`addCity`, `removeCity`, `setDefaultCity`, `getWeather`, `changeSettings`, `listCities`).
- `src/presentation/` — CLI menu, prompts and output rendering.
- `src/storage/` — atomic JSON persistence, legacy migration, cities and settings.
- `src/types/` — shared TypeScript contracts.
- `src/api/` — OpenMeteo geocoding and forecast clients.
- `src/utils/` — formatting, colors, constants and error helpers.
- `tests/` — Bun test suite, helpers and fixtures.

## Commands

- Run: `bun run src/index.ts` (or `bun run start`)
- Tests: `bun run test` (runs `bun test tests`)
- Watch tests: `bun run test:watch`
- Coverage: `bun run test:coverage`
- Typecheck: `bun run typecheck` (runs `bun check`, Bun 1.4+ type checker)
- Focused typecheck: `bun check path/to/file.ts`
- Build binary: `bun run build` (runs typecheck + tests, then outputs `weather.exe` on Windows)

There is no linter or formatter configured. Do not assume `npm test`/`tsc` scripts exist.

## Testing notes

- Tests use `bun:test`; no external test dependencies.
- Storage tests inject `StoragePaths` pointing at temporary directories. Never let tests write to the user's real config.
- API/action tests mock `globalThis.fetch`; no real network calls.
- Use Spanish descriptions in tests and keep assertions deterministic (set `NO_COLOR` when checking output).

## Toolchain notes

- Use Bun (`bun.lock`); do not switch to npm/pnpm or regenerate the lockfile.
- TypeScript 7 (native compiler) comes via `peerDependencies`; types from `@types/bun`.
- `bun init` in the README is the already-completed scaffold step; don't re-run it.

## Code conventions

- `tsconfig.json` is strict with `noUncheckedIndexedAccess`; index/array access can be `undefined`.
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- `allowImportingTsExtensions` is on: import local files with explicit `.ts` extensions and no emit.
- Package is `"type": "module"` with `allowJs`; ESM syntax only.
- Keep user-facing output and menu text in Spanish to match `README.md`.
- Respect `NO_COLOR` and non-TTY output; colors live in `src/utils/colors.ts`.
