# Documents Banner Visual Verification

## Decision

Render the real `DocumentsBanner` through a small App Router fixture and capture
the component in light and dark mode with the repository's existing Playwright
visual suite. The fixture is available only when
`VISUAL_REGRESSION_ROUTES=1`, or by Playwright's dedicated request header while
the server is in development mode. Otherwise the proxy returns `404` before the
page resolves through `notFound()`. Production builds satisfy neither condition,
so the test surface cannot become a public product route.

This approach was selected over two alternatives. Importing the client
component directly into Playwright fails because its ESM icon modules are
compiled by Next.js, not Playwright's Node test loader. Injecting copied static
markup would render quickly but could drift from the production component and
provide false confidence. An authenticated documents-page test would exercise
the full route but requires account state unrelated to this presentational
change and would make the baseline slower and less deterministic.

The fixture composes the production component without duplicating its markup.
The test waits for network idle, verifies the owning React Grab surface and
heading, and records focused light and dark screenshots. Reduced motion is
enabled during capture. A focused 4% pixel tolerance absorbs the measured
macOS-to-Linux text rasterization difference while retaining the component's
geometry, surface, and theme as the baseline. The banner itself keeps the
centered responsive layout, view-only state, semantic heading, and decorative
icon treatment; the previous automatic entrance animation is removed because
repository motion must be input-driven. Focused acceptance continues to verify
source-independent server markup, while the visual baselines cover actual
styling and theming.
