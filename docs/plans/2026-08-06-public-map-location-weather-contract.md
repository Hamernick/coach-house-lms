# Public Map Location, NWS, and Cooling-Center Contract

Date: 2026-08-06
Status: Research 5 complete
Scope: `/find` location state, coarse weather input, NWS integration, heat
relevance, cache policy, provider freshness, and failure behavior
Non-goals: UI implementation, resource promotion, database writes, production
changes

## Decision

Location is optional and exact coordinates remain browser-memory-only. Weather
requests use a coarse area. NWS weather changes relevance only; it never publishes,
hides, or proves that a cooling center is open.

The weather boost activates when either:

1. a current NWS `Heat Advisory`, `Extreme Heat Watch`, or `Extreme Heat Warning`
   intersects the coarse area; or
2. NWS grid data forecasts heat index, apparent temperature, or air temperature
   at or above 100°F for at least two consecutive hours within the next 24 hours.

The forecast threshold is a soft relevance signal, not an official alert. NWS heat
criteria vary by forecast office. The UI must identify whether the signal is an
official alert or a forecast threshold.

## Measured Current State

### Location implementation

The current hook keeps exact coordinates in React state, uses a low-accuracy
browser request, and avoids network writes. A source-guard test expects geolocation
to be limited to same-origin `/find` routes, but the current `next.config.ts` no
longer contains that Permissions-Policy header. The implementation also violates
the intended contract because:

- the expected `Permissions-Policy: geolocation=(self)` route header is absent;
- it spins the globe before the user acts;
- it uses `idle`, `checking`, `centered`, and `unavailable` instead of the required
  permission state machine;
- a session `granted` flag can outlive browser permission and suppress revoked
  permission feedback;
- it does not subscribe to permission changes or clear the marker on revocation;
- it automatically opens the location prompt;
- it has no typed city/ZIP alternative or Search this area action.

The browser permission is authoritative. Session storage may retain only
non-sensitive prompt-seen and user-choice values; it must not stand in for the
browser permission.

### NWS probe

A read-only Chicago probe on 2026-08-06 used
`CoachHouseFind/1.0 (https://coachhouse.app)` and returned:

| Endpoint                                | Result                                | Observed origin cache             |
| --------------------------------------- | ------------------------------------- | --------------------------------- |
| `/points/41.8781,-87.6298`              | `200`, grid `LOT/76,73`               | `max-age=56484`, `s-maxage=120`   |
| `/gridpoints/LOT/76,73/forecast/hourly` | `200`, 156 periods                    | `max-age=2306`, `s-maxage=3600`   |
| `/gridpoints/LOT/76,73`                 | `200`, heat-index and HeatRisk fields | `max-age=3600`, `s-maxage=3600`   |
| `/alerts/active?point=41.8781,-87.6298` | `200`                                 | `max-age=5`, `s-maxage=5`         |
| `/alerts/types`                         | `200`                                 | `max-age=86400`, `s-maxage=86400` |

The current event-type response contains `Heat Advisory`, `Extreme Heat Watch`,
and `Extreme Heat Warning`. NWS renamed the former Excessive Heat watch/warning in 2025. Normalize the legacy names only for old fixtures or cached records.

### Cooling-center inventory

| Evidence                                   | Count |
| ------------------------------------------ | ----: |
| Local cooling/heat source cohorts          |    22 |
| Official source cohorts                    |    20 |
| Partner/community source cohorts           |     2 |
| Registry rows represented by those cohorts | 3,541 |
| Current local cooling candidates           | 3,542 |
| Candidates with `lastVerifiedAt`           |     0 |
| Production public cooling-center rows      |     0 |

All 22 local source cohorts require manual confirmation. Ten lack a source
`modifiedAt`; six of the twelve dated sources were older than 180 days at the
audit date. The candidate freshness score is not operational verification.

Weather promotion therefore has no eligible production rows today and must be a
no-op. The 3,542 local candidates stay outside `/find` until Batch 4 evidence,
review, deduplication, and promotion gates pass.

## Location State Machine

Use exactly these user-facing states:

| State         | Entry                                                              | Behavior                                                                               |
| ------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `unsupported` | insecure context or missing Geolocation API                        | Explain browser limitation; offer city/ZIP                                             |
| `prompt`      | browser permission is `prompt`                                     | Do not request or open automatically; explain after control click                      |
| `requesting`  | user confirmed, or prior browser permission is already granted     | One cancellable low-accuracy request                                                   |
| `granted`     | valid position returned                                            | Keep exact point in memory; render marker; derive coarse area                          |
| `denied`      | permission denied or revoked                                       | Clear exact point and marker; stop automatic requests; show settings guidance on click |
| `error`       | timeout, unavailable position, invalid result, or provider failure | Preserve map state; offer retry and city/ZIP                                           |

Requirements:

- Query `navigator.permissions` when supported and subscribe to its `change`
  event.
- A prior browser grant may refresh silently because the user already granted it.
- `prompt` never calls `getCurrentPosition` until the user confirms.
- Never auto-spin, auto-fly, or open a consent dialog on first load.
- Abort/ignore stale requests and clear coordinates on revoke, disable, route exit,
  or page unload.
- Do not log, persist, or place exact coordinates in URLs, server actions,
  analytics, auth metadata, shared caches, or pending auth intents.
- Keep only `location_prompt_seen` and a choice such as `not_now`,
  `browser_location`, or `manual_area` in guest session storage or the future typed
  private preference record.
- City/ZIP accepts locality only, resolves through a server-side provider adapter,
  returns a bounded coarse result, and never stores a street-level query. The
  existing organization geocoder must not be exposed directly as an unaudited
  public search endpoint.
- Panning never changes the saved preference. Search this area is explicit.

## Coarse-Area Privacy Contract

Derive a 0.05-degree latitude/longitude cell in the browser and send only its cell
center to the weather route. This is roughly a 4–6 km cell across much of the
continental US and is precise enough to resolve an NWS grid without transmitting
the browser point.

The server:

1. validates US bounds and finite coordinates;
2. rejects precision beyond the normalized cell contract;
3. resolves `/points/{cell-center}` to the NWS office/grid and forecast zone;
4. keys shared caches by versioned coarse cell and resolved NWS grid, never user,
   session, IP, raw viewport, or exact coordinates;
5. logs only coarse cell, grid ID, cache result, upstream status, latency, and
   signal class;
6. does not return the submitted cell center to the client.

For a broad viewport, cap evaluation to the center plus at most four representative
coarse cells. Deduplicate alerts by NWS alert ID and resources by canonical ID.

## NWS Adapter

All NWS calls are server-side and use:

- `User-Agent: CoachHouseFind/1.0 (https://coachhouse.app)`;
- `Accept: application/geo+json`;
- bounded timeout and one retry only for transient network, `429`, or `5xx`
  responses;
- `/points/{coarse-center}` for office/grid/zone discovery;
- `/gridpoints/{office}/{x},{y}` for heat index, apparent temperature, air
  temperature, HeatRisk, and validity intervals;
- `/alerts/active?point={coarse-center}` for active alerts;
- an adapter boundary that can add the future NWS API key without changing map
  code.

NWS does not publish a fixed general API limit. Respect origin cache directives,
share requests by coarse cell/grid, and never poll alerts more frequently than the
NWS-documented 30-second floor. Coach House uses a two-minute alert cache because
this feature is relevance guidance, not an emergency alert service.

## Cache Contract

| Data                               | Fresh TTL | Stale-if-error | Validity checks                                                                          |
| ---------------------------------- | --------: | -------------: | ---------------------------------------------------------------------------------------- |
| Coarse cell to NWS point/grid/zone |      24 h |            7 d | Re-resolve daily because office/grid can change                                          |
| Grid forecast data                 |    30 min |            6 h | Generated/update time present; intervals overlap next 24 h                               |
| Active heat alerts                 |     2 min |         15 min | `status=Actual`; not cancelled; effective/onset and expires/ends contain evaluation time |
| Current alert event-type allowlist |      24 h |            7 d | Retain last known list; alert parser still uses a code allowlist                         |
| Weather decision response          |     2 min |         15 min | Contains no user-specific data or exact coordinates                                      |

Stale data may be used only after an upstream failure and only inside the stated
budget. Mark it delayed. An expired alert never promotes. A forecast older than six
hours never promotes. Beyond the stale budget, return neutral ranking with no
weather claim.

## Heat Decision

Evaluate in this order:

1. Current official alert: `Heat Advisory`, `Extreme Heat Watch`, or
   `Extreme Heat Warning`. Historical `Excessive Heat Watch/Warning` values
   normalize to their current names.
2. Otherwise, expand NWS ISO-8601 valid intervals into the next 24 hours. Promote
   when heat index, apparent temperature, or air temperature is at least 37.78°C
   (100°F) for two consecutive hourly slots.
3. Otherwise, or when data is invalid/unavailable, keep normal ranking.

Do not infer a local NWS advisory from the 100°F threshold. Store and return:

- `signal: official_alert | forecast_threshold | none`;
- normalized alert event, severity, effective/end time, and NWS ID when present;
- forecast metric, threshold, first qualifying time, duration, and update time;
- `freshness: fresh | stale`, cache age, and NWS source URL;
- no prose from the alert beyond a short sanitized headline.

## Cooling-Center Eligibility

Weather can boost only a canonical, approved, public cooling resource with valid
coordinates and one of these states:

- `active_verified`: eligible for boost;
- `searchable_unconfirmed`: searchable/filterable, never boosted;
- `closed_or_withdrawn`: follows the normal curation/unpublication process and is
  never boosted.

`active_verified` requires authoritative provider evidence for facility type,
activation model, address, and access instructions. It also requires:

- standing/year-round site: provider status and hours verified within 30 days;
- event-activated or seasonal site: official activation/status refreshed within
  24 hours and current provider hours/access evidence;
- no `closed`, `temporarily_closed`, expired activation, conflicting hours, or
  unresolved duplicate state.

Missing hours never becomes Open now. Every promoted result says Confirm hours
before visiting and links to the provider evidence when public. Weather expiry does
not hide the resource; it removes only the boost and weather label.

## Failure Behavior

- Permission denial/revocation: clear location, keep viewport/results, offer
  city/ZIP.
- Position timeout/error: stop loading, preserve context, allow retry.
- Non-US or NWS point failure: weather unavailable; normal ranking.
- NWS `429`/`5xx`/timeout: one bounded retry, then eligible stale cache or neutral.
- Malformed units, intervals, alert dates, or unsupported event: ignore that
  signal; never guess.
- Empty eligible cooling set: no weather UI or empty promotion group.
- Stale provider evidence: retain approved search discoverability but remove
  weather boost.
- Weather feature flag off: normal ranking, location remains independently usable.

## Test Corpus

The source-backed cases live in
`tests/fixtures/public-map-weather/nws-weather-contract.json`. Required tests cover:

- each current alert type and historical-name normalization;
- forecast threshold hit, insufficient duration, and below threshold;
- expired/cancelled alert;
- null/malformed units and intervals;
- stale forecast/alert inside and beyond budget;
- NWS `429`, timeout, and `5xx` fallback;
- unsupported/prompt/granted/denied/revoked/error location transitions;
- exact-coordinate absence from route, cache key, logs, and response;
- zero eligible cooling resources;
- active, unconfirmed, seasonal, stale, closed, and withdrawn providers.

## Release Gates

Batch 5 cannot ship this slice until:

1. the location state machine passes permission-change and city/ZIP journeys;
2. network/log/cache fixtures prove exact coordinates never leave the browser;
3. NWS schema, units, intervals, event aliases, timeouts, retries, and cache tests
   pass;
4. provider freshness and activation eligibility are enforced server-side;
5. production has reviewed cooling rows or the feature remains an inert no-op;
6. weather can be disabled independently without changing normal ranking;
7. screenshots are supplied before the planned `/find` UI is built.

## Primary Guidance

- [NWS API Web Service](https://www.weather.gov/documentation/services-web-api)
- [NWS Alerts Web Service](https://www.weather.gov/documentation/services-web-alerts)
- [NWS heat-product name change](https://www.weather.gov/media/tbw/heat/HeatHazSimpFactsheet.pdf)
- [NWS Chicago heat criteria](https://www.weather.gov/lot/1995_heatwave)
