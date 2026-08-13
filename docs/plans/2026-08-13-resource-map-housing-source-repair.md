# Chicago housing listing source repair

Date: 2026-08-13

## Outcome

The saved Chicago housing group contains 106 listings. All 106 already include
a service, summary, category, location, contact, eligibility, access steps, and
the 211 Metro Chicago source.

This pass raised listings with a second provider source from 92 to 99. Nothing
was imported, approved, published, or changed in production.

| Result                                                     | Listings |
| ---------------------------------------------------------- | -------: |
| Ready for later human review                               |       99 |
| Held because a second provider source could not be checked |        7 |
| Total                                                      |      106 |

## Repaired listings

- Community Supportive Living Systems — Emerald House
- Lincoln Park Community Services — Permanent Supportive and Affordable Housing
- Family Promise Chicago North Shore — Family Transitional Housing
- Brave Space Alliance — Jasmine Alexander Housing Initiative
- Covenant House Illinois — Residential Program
- Josselyn — Resiliency Center
- Puerto Rican Cultural Center — Drop-in center or day shelter

The source-specific importer now replaces stale links with current provider
pages. The checker remains bounded but accepts modern provider pages up to 1.5
MB; the four supported pages that exceeded the former limit were 789 KB to
1.28 MB.

## Listings still held

- Four AIDS Foundation of Chicago listings: the official site returned HTTP 403
  to the automated checker.
- Child Link — Transitional Living Program: the official site returned HTTP 403.
- The L.A.M. House Transitional Home: no provider-owned website was found.
- Willis House of Refuge: the provider website redirects to a 404 page.

The checker does not treat those seven listings as independently supported.
They remain unavailable for automatic promotion.

## Evidence

- Input artifact: `211-metro-chicago-housing-services.provider-verified.jsonl`
- Input SHA-256:
  `dc6f5eac3b11597673ee1268ca3533e48e3af2d73cede724cb2365462d54ed72`
- Focused importer and provider-page tests: 11 passed.
- The documented `pnpm resource-map:verify-provider-pages` command is now wired
  into `package.json`.
