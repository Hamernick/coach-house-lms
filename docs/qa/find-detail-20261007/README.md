# Find resource detail crash

User reproduction: search `housing`, open `Housing Forward - Emergency Overnight Shelter` in Oak Park. Reproduced React #185 on production and maximum update depth locally, before the fix. No production data was changed.

The four detail-panel `next/dynamic` calls had no local loading boundary. Their first render suspended the entire Find shell; its layout/ref state updates repeatedly detached and reattached the shell. The NavigationMenu ref in the final error stack was part of that cycle, not sufficient evidence of another primitive defect. Loading now stays within the selected panel.

Validation:

- Added browser regression failed against the unchanged checkout before the fix, then passed at 1280px and 390px: search, first open, detail content, back preserving query, reopen, no route/React errors.
- Exact live public listing opened on the fixed localhost:3110 with public API responses forwarded read-only from production. [Capture](housing-forward.png). It proves rendering, not current shelter availability.
- Browser regression uses explicit intercepted test data, never a production publication or intake row.
- macOS interaction check only; no screenshot comparisons or baseline changes. Hosted visual checks remain authoritative. Existing settled detail layout is unchanged; the transient loading message uses muted semantic text and `role="status"`.

Run the committed regression in the repository's supported environment:

```bash
pnpm exec playwright test --config=playwright.visual.config.ts tests/visual/find-resource-detail.visual.spec.ts
```

For local interaction-only debugging, use a temporary Playwright config targeting that test and the intended existing server. Do not change visual-environment guards or baselines.
