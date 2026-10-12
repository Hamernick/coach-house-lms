# Presentation release sprint — October 12

User now authorizes shipping public surfaces and a working guest fiscal MVP; this supersedes earlier no-release/preview-only direction. Target preparation in 15 minutes, use remainder of 45-minute window for gates/deployment/live review. No bypass of quality/security/review gates.

- [x] Scope: homepage, Resources, public Documentation/redirects, Build and pricing.
- [x] Remove competing free-profile/gating work; other branch owns onboarding.
- [x] Independently gate optional fiscal signup/profile import off for this MVP.
- [x] Add private guest Overview and atomic initial reviewer notifications.
- [ ] Validate connected database, reviewer isolation, notifications and focused public routes.
- [ ] Review pending migration dependency chain, apply only needed migrations with intake off, verify ledger and RLS.
- [ ] Configure internal host/reviewers, delivery/retention scheduling, secrets and provider tracking.
- [ ] Commit/sync main, secret scan, PR/current-head hosted quality/review, affected Linux visuals.
- [ ] Deploy public pages; activate guest submission only after required storage/email readiness.
- [ ] Live controlled submission: one project, filled fiscal view, overview, two reviewer notifications and three emails; retry makes no duplicates.

Deferred: optional profile import/new onboarding connection, final media/copy polish. Known blocker at start: Vercel stored token expired, user asked to log in. No production mutation or actual delivery claimed yet.
