# Build and Collect Public Navigation

## Outcome

Coach House has two clear public entry paths:

- **Collect** at `/`: find, save, and share nonprofit organizations, programs,
  and community resources.
- **Build** at `/build`: understand the workspace and accelerator, review
  pricing, and continue to sign in or create an account.

This is a stacked follow-up to PR #225 because that branch owns the canonical
root Find shell. The nonprofit documentation branch remains separate.

## Approaches

### Shared public header and dedicated Build route — selected

Extract one responsive header feature used by root Find and `/build`. The
center navigation mirrors the supplied references: compact active pills and
hover/focus menus. A search field submits to `/?q=…`; the high-contrast action
opens `/build`.

This creates the intended information architecture without duplicating route
logic or exposing unfinished documentation URLs.

### Home Canvas-only navigation

Updating only `/home-canvas` would be smaller, but the canonical root would
still use a different header and builders would still lack a stable route.

### Merge documentation and navigation immediately

This could expose the full future menu, but it would combine two independently
active branches and make review, rollback, and ownership harder.

## Components

- `BuildCollectPublicHeader`: logo, centered Collect/Build navigation, search,
  Build action, theme control, and compact mobile treatment.
- `BuildCollectNavigationMenu`: shadcn `NavigationMenu` composition supporting
  pointer hover, keyboard focus, touch/click, active-route state, and real links.
- `BuildPublicLanding`: centered builder introduction, workspace preview,
  accelerator/pricing entry cards, and sign-in/sign-up actions.
- `/build/page.tsx`: metadata and composition only.

The root Find header keeps its existing sidebar and right-rail controls. The
shared header accepts those controls as slots so it does not learn map state.

## Route contract

| Action         | Destination    |
| -------------- | -------------- |
| Collect        | `/`            |
| Search         | `/?q=<query>`  |
| Build          | `/build`       |
| Workspace      | `/workspace`   |
| Accelerator    | `/accelerator` |
| Pricing        | `/pricing`     |
| Sign in        | `/login`       |
| Create account | `/sign-up`     |

Documentation links will be added only after the documentation branch lands.

## Responsive and accessible behavior

- Desktop keeps the logo left, navigation centered, and search/action controls
  right.
- Tablet hides the full search field before compressing navigation labels.
- Mobile keeps Collect and Build reachable, moves secondary destinations into
  the Build menu, and preserves 44px touch targets without horizontal overflow.
- Menus open on pointer hover and keyboard focus through shadcn primitives;
  every destination remains operable by click, Enter, Space, and touch.
- Reduced motion disables decorative transitions without changing state.

## Validation

- Acceptance tests cover route destinations, active state, search form action,
  and shared-header composition.
- Browser tests cover hover/focus menus, search submission, `/build`, mobile
  containment, and existing Find shell controls.
- Run Graphify update, the focused checks, then `pnpm check:quality` before a
  stacked pull request is opened.
