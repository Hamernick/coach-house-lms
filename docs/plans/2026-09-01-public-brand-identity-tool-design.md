# Public Brand Identity Tool

## Outcome

Publish `/documentation/tools/brand-identity` as a public, device-local brand
system builder for U.S. nonprofit teams. Anyone can complete the guide, preview
the system, upload their own assets, and download a portable brand package
without creating an account or purchasing a plan.

## Visual direction

The supplied Folk guideline screenshots are the visual source of truth:

- quiet editorial canvas with a narrow section index and a focused content column
- generous vertical rhythm, restrained borders, small radii, and no decorative chrome
- large visual specimens followed by concise usage guidance
- direct actions for copying values and downloading source assets
- one continuous document rather than a dashboard of disconnected cards

Coach House retains its existing public/authenticated canvas and navigation rail.
The page adds a document-level section index inside the content surface; it does
not create another permanent application rail.

## Access and persistence

- Anonymous, signed-in free, and signed-in paid visitors receive the same tool.
- Text, colors, proportions, and type settings autosave to browser local storage.
- Uploaded assets persist in IndexedDB on the same device.
- The interface states this boundary plainly: saved on this device, not synced.
- Account sync is a later enhancement and must not become a prerequisite for use.

Browser-local storage was selected over an account-only editor because it meets
the universal-access requirement without an authentication or billing boundary.
It was selected over a one-session form because the guide is intentionally long
and should survive refreshes and return visits.

## Information architecture

1. Foundation: organization name, tagline, introduction, purpose, and audience.
2. Marks: primary logo and mark uploads, light/dark specimens, scale, and usage notes.
3. Color palette: four fixed functional roles, optional user-defined names, exact computed color values, proportions, and contrast checks. The tool never infers or invents a color name from a selected value.
4. Typography: at least 30 grouped system-font choices with portable fallbacks, a base size, a modular ratio, and a live type scale.
5. Applications: editable campaign copy and live social/header compositions.
6. Assets: optional application photography and six illustration slots.
7. Exports: ZIP package, CSS tokens, JSON data, usage notes, originals, and print view.

## Export contract

The ZIP contains:

- `brand/brand.json`: portable structured brand data
- `brand/tokens.css`: CSS custom properties and typography tokens
- `README.txt`: plain-language usage and accessibility notes
- `assets/`: uploaded originals with stable, sanitized names

Downloads are generated entirely in the browser. The feature does not transmit
uploaded files to Coach House or a third party.

## Responsive behavior

- Desktop: sticky in-page section index and wide specimen column.
- Tablet: compact horizontal section navigation above the document.
- Mobile: single-column sections, full-width fields and previews, and a sticky
  section selector that preserves access to every part of the guide.

## Acceptance

- The route is crawlable and has canonical metadata plus WebApplication JSON-LD.
- Every visible core control works with keyboard, pointer, light theme, and dark theme.
- Contrast ratios use WCAG relative luminance math.
- Invalid colors do not corrupt the preview or export.
- Reset is confirmed and clears both structured data and stored assets.
- ZIP export is valid and includes all available originals.
- Existing documentation and public/authenticated shell behavior remain unchanged.
