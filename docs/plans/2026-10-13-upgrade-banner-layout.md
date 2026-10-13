# LIVE-04: compact upgrade banners

Original source: packet03 later intake U20261013-01, scoped stage2 billing entry presentation. User requested smaller free-account upgrade banners with proper gaps and maximum widths. User confirmed PR297 merged and explicitly took ownership of visual checking; no merge verification, production browser pass, screenshots or automated UI journey was performed for this continuation.

## Scope and implementation

Branch `fix/upgrade-banner-layout-20261013`, worktree `coach-house-platform-upgrade-banners-20261013`, base `e49a31bd3544094a18e11905e13192fac2ee93c6`. One shared FeatureUpgradeNotice change covers Documents, Roadmap, Accelerator and invitations. Center a maximum768px wrapper with16px vertical gaps and horizontal insets. Use container width to place the CTA beside copy in sufficiently wide panels; narrow drawers stack it with a44px touch target. Preserve copy, entitlement checks, checkout behavior and focus restoration. Long headings wrap.

Local user review: http://localhost:3116/visual-regression/upgrade-banners. Uses the actual shared component in wide/narrow examples, gated by the existing visual-regression access guard; enabled only in this local server process. Actual app: http://localhost:3116/my-organization. No Supabase previews or provider changes. Shared env and unrelated servers remain untouched.

## Checks and stop boundary

Changed-file ESLint, route-entry contract and diff checks pass. Styling-only change: no new implementation-mirroring tests, automated screenshots or baseline replacement. User reviews appearance; existing hosted CI/review remain required before release. Graphify refresh started. Stop at this bounded banner PR and user review; Calendar is next after this slice. Prior map production/rendering verification belongs to the user and is not asserted complete from their merge confirmation.
