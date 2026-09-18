# Hover Restraint

Frequent interactions should track the pointer immediately.

## Rules

- Use instant hover state changes for navigation, catalog items, and repeated
  controls. Avoid opacity, color, or position delays that trail the pointer.
- Reserve motion for changes that explain cause and effect.
- Delay the first tooltip by roughly 400–700ms; nearby tooltips may then open
  immediately.
- Keep keyboard shortcuts and frequently toggled panels immediate.
- Honor reduced-motion preferences for any remaining animation.

Source: [Hover Restraint](https://craft.gustavofior.com/hover-restraint), Gustavo
Fior, published 2026-07-15.
