# Feature Slices

Use `pnpm scaffold:feature <kebab-name>` to create new feature modules.

Each feature lives in `src/features/<feature-name>/` and must expose a stable public entrypoint:

- `index.ts` (public exports only)
- `types.ts`
- `components/**`
- `lib/**` (pure domain logic)
- `server/**` (server-only actions/queries)
- `tests/acceptance/<feature-name>.test.ts` (acceptance baseline)

Quality gates enforce this contract via `pnpm check:features`.
