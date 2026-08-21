# Find Loading State Design

## Goal

Make the initial `/find` state feel like the page is already present while its
server data resolves. The loading UI must preserve the final map and permanent
drawer geometry instead of presenting a generic two-column skeleton.

## Design

- Keep the existing public Find shell and edge-to-edge map frame visible.
- Use a quiet, non-interactive map illustration as temporary spatial context.
- Match the final 168px bottom drawer at every viewport, including its handle,
  Find/Guides/My Map tabs, search field, and category row.
- Put the only progress indicator in the location/status control position so
  content does not compete for attention.
- Keep session-dependent Login and Sign up actions out of the neutral loading
  shell; the resolved guest or authenticated shell owns those actions.
- Keep decorative map and drawer placeholders out of the accessibility tree;
  expose one polite loading status and `aria-busy` on the surface.
- Disable the spinner for reduced-motion users.

## Validation

- Acceptance coverage verifies route composition, final-layout geometry,
  accessible status, reduced-motion handling, and removal of generic Skeleton
  usage.
- Visually verify light/dark desktop and mobile layouts without overflow or
  layout shift.
