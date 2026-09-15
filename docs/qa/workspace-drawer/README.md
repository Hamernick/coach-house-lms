# Workspace drawer: bounded geometry regression

September 14, 2026. Profile branch, base `8673bcff`.

## Result

Delayed portal mounting alone rendered correctly. A container growing from
220px to 320px without a window resize left Vaul's collapsed translation at
152px: **168px visible instead of 68px**. Both immediate and 60ms delayed portals
failed. Vaul 1.1.2 observes window resize but does not observe its container.

The actual `useWorkspaceDrawerSnapPoints` source hook observes container height
and refreshes the snap-point array after changes. Both fixed cases measured
252px translation, **68px visible**. With the delayed portal, control transitions
also measured 153.6px (48%), 320px (full), and 68px (collapsed).

This proves and fixes stale container geometry. It does **not** establish that
container resizing caused the user's original hosted first-authenticated-load
failure. A fresh authenticated Bandto Preview tab at 8673bcff rendered correctly:
878px canvas, 810px translation, 68px visible, 36px inner viewport; sampled
error/warning logs were empty. First navigation's immediate inspection timed out;
measurements were taken after it settled, not frame-by-frame from first paint.

## Reproduce without Next

From this worktree:

```sh
node docs/qa/workspace-drawer/run-fixture.mjs
```

Open http://127.0.0.1:3043/ in the supported Chrome connection. Wait until the
canvases grow, then compare baseline and fixed cases. Use the final case's
Collapsed / Half / Full buttons to check transitions. The fixture uses installed
React and Vaul plus the actual fix hook, bundles approximately 259 KB, serves
only static assets on loopback, and uses no application/provider data. Stop with
Ctrl-C. It performs no Next build and starts no Next server.

Validation: targeted ESLint and all 11 existing drawer acceptance tests passed.
No intended design changes or baseline updates. Full quality/hosted cold-load
regression remains pending; no release approval. Graphify refresh deferred under
the user's laptop-resource restriction.
