# Nested Border Radius

Nested corners should share a visual center.

## Rule

Use this relationship as the starting point:

> inner radius = outer radius - inset

Include padding and intervening border width in the inset. Clamp the result at
zero, then tune by eye when edges do not have equal spacing or use different
corner shapes.

Example: a card with a 16px outer radius and an 8px inset should start with an
8px media radius.

Source: [Nested Border Radius](https://craft.gustavofior.com/nested-border-radius),
Gustavo Fior, published 2026-07-14.
