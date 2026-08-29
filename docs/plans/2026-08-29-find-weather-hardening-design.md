# Find Weather Production Hardening

Date: 2026-08-29
Status: Implemented and locally verified
Scope: `/find` weather accuracy, refresh behavior, NWS failure handling, and
cooling-resource promotion truth

## Decision

Preserve the compact temperature-only square and the existing coarse-location
privacy boundary. Separate three concerns that currently share one response:

1. Display temperature uses a recent quality-controlled NWS station observation
   when available, then a current NWS grid forecast as a clearly identified
   fallback.
2. Heat relevance continues to use an active official NWS heat alert first and
   the existing 100F-for-two-hours forecast rule only as a soft fallback.
3. Cooling resources remain searchable at all temperatures. Weather may promote
   only published, recently verified cooling resources whose computed public
   availability confirms they are open now.

This extends the contract in
`docs/plans/2026-08-06-public-map-location-weather-contract.md`; it does not
claim a generic threshold means a jurisdiction activated a cooling center.

## Data Flow

The server resolves a coarse cell through NWS `/points`, fetches alerts and grid
forecast data, resolves the nearest listed observation station, and requests its
latest quality-controlled observation. NWS URLs remain host-allowlisted. Point
and station metadata use long caches; observations, alerts, and the final
response use short caches.

The response records `temperatureSource` as `observation` or `forecast` and
builds a badge snapshot from temperature, timestamp, source, and freshness
alone. City, state, daily high, and daily low become optional metadata and can
never suppress the temperature badge.

## Client Reliability

The location-scoped hook keeps its last good response, refreshes every ten
minutes while visible, refreshes when the document returns to the foreground or
the browser comes online, and retries transient failures with bounded backoff.
Each client request has a timeout and shared in-flight requests remain
deduplicated by coarse cell.

No refresh stores exact coordinates or writes them to a URL. The browser sends
only the existing 0.05-degree cell center to the same-origin weather route.

## Failure And Truth Rules

- A missing or stale observation falls back to a valid current forecast.
- A stale forecast may remain visible as delayed temperature data but never
  activates forecast heat relevance.
- Missing alerts or malformed provider data yield an unknown heat signal and
  normal marker ranking.
- Exercise, test, cancelled, expired, and malformed alerts never activate heat
  relevance.
- Unknown, closed, appointment-only, or stale cooling availability never gains
  weather promotion. The resource remains normally searchable.
- Provider failures emit structured, coordinate-free server warnings.

## Verification

Focused tests cover observation parsing and fallback, optional metadata,
forecast freshness, alert validity, response validation, retry scheduling,
request safeguards, and cooling-resource availability. Browser verification
must preserve the square badge at mobile and desktop sizes, accurate accessible
labeling, no overlay collisions, and normal map behavior when weather is absent.

Before release, run the repository quality gate and verify the production-like
NWS path with no browser extensions altering hydration. Weather and cooling
promotion remain independently removable from normal map ranking.

Local verification completed on 2026-08-29: focused weather contracts, the
2,233-test acceptance suite, production build, `/find` performance budget, and
34 visual tests passed. The repository-wide RLS stage remains blocked by its
Node 20 WebSocket and local Supabase harness environment, outside this slice.
