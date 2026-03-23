# PrototypeLab Feature

## Ownership
- Domain logic: `src/features/prototype-lab/lib/**`
- Server queries: `src/features/prototype-lab/server/**`
- UI components: `src/features/prototype-lab/components/**`

## Rules
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep this surface explicitly internal-only and admin-only.
- Keep the prototype tree in the real app sidebar under `Prototypes`; do not render a second file tree inside the page body.
- Each prototype entry should render one centered canvas only. The canvas stays blank until a specific prototype is being designed.
- Prototype code stays isolated here until it is intentionally promoted into production features.
- When a prototype is approved, extract only the reusable parts and delete the temporary lab-specific seams.
