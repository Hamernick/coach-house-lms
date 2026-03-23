# React Grab Execution Contract

Use this workflow whenever the user pastes a React Grab component tree and asks for a change.

## Required Ownership Trace Before Editing

Before mutating any file, identify all four layers:

1. **Semantic owner**
   - The element carrying `data-react-grab-anchor`
   - This is the conceptual control the user is pointing at

2. **Portal/linked surface**
   - Any linked `TooltipContent`, `SelectContent`, callout bubble, or overlay using `data-react-grab-link-id`
   - Trigger and content are separate surfaces unless proven otherwise

3. **Final class assembly file**
   - The file that actually builds the relevant `className`
   - Do not stop at public barrels, support modules, or parent compositions if they do not assemble the final classes

4. **Shared token owner**
   - The file that owns the reusable color/chrome token
   - For tutorial surfaces, this should be `src/components/workspace/workspace-tutorial-theme.ts`

If any of the four are unknown, do not edit yet.

## Mutation Rules

- Do not patch tutorial presentation to fix live canvas behavior.
- Do not patch the nearest wrapper if a shared token file owns the surface.
- Do not redefine tutorial dark/light chrome in feature wrappers.
- Do not assume `PopperAnchor` and `PopperContent` share the same owner.
- Do not trust public barrel paths as ownership proof; use the concrete source file in React Grab metadata.

## Expected React Grab Metadata

All semantic owners should expose:
- `data-react-grab-anchor`
- `data-react-grab-owner-id`
- `data-react-grab-owner-component`
- `data-react-grab-owner-source`

All linked portal surfaces should expose:
- `data-react-grab-link-id`
- `data-react-grab-surface-component`
- `data-react-grab-surface-source`
- `data-react-grab-surface-kind`

Use the shared helpers in `src/components/dev/react-grab-surface.ts`.

## Working Pattern

When the user pastes an element:

1. Trace the pasted node to the semantic owner id.
2. Open the semantic owner source file.
3. Open the final class assembly file for the exact surface.
4. Open the shared token owner file.
5. Patch the highest valid owner only.

## Common Failure Modes To Avoid

- Fixing a tutorial shell because it visually resembles the live workspace card
- Fixing tooltip content when the wrong styling lives on the trigger
- Fixing trigger chrome when the bug is actually the shared token
- Adding one-off dark mode overrides to feature wrappers
- Editing large support files without first checking whether the surface has already been extracted
