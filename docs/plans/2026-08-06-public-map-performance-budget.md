# Public Map Performance Budget

Date: 2026-08-06

Status: Research 4 performance baseline and implementation contract. No
production data, deployment, or public behavior changed.

## Decision

`/find` must not download or materialize the full resource directory on initial
load. Batch 4 will separate three contracts:

1. A minimal, server-filtered marker index for the current bounding box.
2. A cursor-paginated list/search result contract.
3. Full resource detail fetched by canonical ID only when selected.

Saved, selected, explicit-search, and safety-promoted resources remain visible
through explicit ID hydration even when they fall outside the normal marker
sample. The list remains complete through pagination; marker suppression never
hides a result from search.

This follows Mapbox's documented performance model: render and source-update
costs grow with sources, layers, and feature vertices, while vector tiles load
only visible features. Mapbox also recommends clustering dense points at low
zoom, removing unused GeoJSON properties, and avoiding attempts to show every
feature at low zoom. See [Mapbox GL JS performance](https://docs.mapbox.com/help/troubleshooting/mapbox-gl-js-performance/)
and [large GeoJSON guidance](https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/).

## Measured Baseline

Measurements used the current worktree, the explicit local curated preview,
the public production endpoint, and the production public RPC. Payload sizes
are response-body bytes before transport compression unless labeled otherwise.

### Endpoint payload and latency

| Surface                                     | Returned |         Raw | Gzip estimate | Brotli estimate | Samples                           | Result                            |
| ------------------------------------------- | -------: | ----------: | ------------: | --------------: | --------------------------------- | --------------------------------- |
| Local `/api/public/resource-map/items`      |    5,046 | 9,210,384 B |     532,284 B |       367,009 B | 4,270.61 / 4,318.49 / 4,729.35 ms | Fails payload and latency budgets |
| Production `/api/public/resource-map/items` |      500 |   872,623 B |     103,423 B |        79,268 B | 313.18 / 69.67 / 250.10 ms        | Truncated; 500 of 853 public rows |

The local warm median was `4,318.49 ms`. Production responded from Vercel cache
and used Brotli, but its deployed endpoint returned only `500` of the `853`
canonical public rows. This is a release-parity defect. The worktree query now
paginates the public RPC in 500-row pages up to 5,000 and has a 1,205-row
regression, but that local code is not deployed.

### Public RPC

Five sequential read-only samples produced:

| Query                            | Rows |       p50 | observed p95 |
| -------------------------------- | ---: | --------: | -----------: |
| First page, limit 500            |  500 | 349.13 ms |    631.05 ms |
| Second page, offset 500          |  353 | 187.73 ms |    193.43 ms |
| Text search `cooling`, limit 100 |    1 |  96.24 ms |    129.44 ms |
| Category `emergency`, limit 100  |    1 | 117.96 ms |    127.09 ms |
| Chicago radius, 25 miles         |  500 | 280.13 ms |    394.10 ms |
| Phoenix radius, 50 miles         |    0 | 104.85 ms |    209.79 ms |

The RPC supports text, category, radius, limit, and offset. It does not support
a bounding box or cursor, so bbox and cursor performance cannot yet be measured.

### Browser-side work at 5,046 records

| Operation                              |                Result |
| -------------------------------------- | --------------------: |
| Same-location point features           |                 4,722 |
| GeoJSON size                           |           4,248,843 B |
| Data-version build, p95                |             15.857 ms |
| Feature build, p95                     |             32.391 ms |
| Relevance build, p95                   |             35.202 ms |
| Warm client search, worst measured p95 |              2.240 ms |
| Visible relevance tiers                | 20 / 40 / 262 / 4,722 |

Client text matching is already fast after indexing. Payload transfer, full
GeoJSON materialization, and feature/relevance rebuilds are the bottlenecks.
The feature and relevance passes each exceed one 16 ms frame, even though the
low-zoom visual sample is small. Zoom filtering therefore reduces clutter but
does not reduce the downloaded or source-materialized dataset.

## Release Budgets

These are Coach House product budgets, not universal Mapbox limits. Measure on
desktop and a representative lower-end mobile profile before Gate 4.

| Area                           | Required budget                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Publication parity             | API count equals the canonical public count; no silent cap                                                                                       |
| Initial marker request         | Current bbox plus overscan only; at most 500 point features and 100 KB Brotli                                                                    |
| Marker fields                  | ID, type, category, coordinates, short label, verification/status, rank signals only                                                             |
| List/search page               | Cursor-based; 50 results maximum; at most 150 KB raw                                                                                             |
| Detail                         | One canonical resource on demand; at most 50 KB raw                                                                                              |
| Warm bbox/index latency        | p95 at or below 200 ms                                                                                                                           |
| Uncached bbox/index latency    | p95 at or below 400 ms                                                                                                                           |
| Search/category latency        | p95 at or below 250 ms                                                                                                                           |
| Radius/location latency        | p95 at or below 300 ms                                                                                                                           |
| Search feedback                | Existing drawer opens immediately; useful loading state within 100 ms; results or explicit empty/error state within 1 second on the test profile |
| Client search/filter           | p95 at or below 16 ms                                                                                                                            |
| Marker transform and relevance | Combined p95 at or below 16 ms per update; no task above 50 ms                                                                                   |
| Visible marker density         | Overview at most 50; city at most 100; local area at most 300; close viewport at most 500                                                        |
| Cache                          | Stable public requests use ETag or equivalent revalidation plus bounded stale-while-revalidate                                                   |
| Request lifecycle              | Abort stale pan/search requests; deduplicate by canonical ID; ignore out-of-order responses                                                      |

Saved and selected markers may exceed a density tier only as explicit overrides.
If a viewport contains more eligible results than its marker budget, preserve a
category-diverse deterministic sample and expose the complete cursor-paginated
list.

## Bbox, Pagination, and Vector-Tile Rule

Batch 4 must first implement indexed bbox filtering, stable cursor pagination,
the minimal marker projection, and detail-on-demand. Offset pagination may
remain only as a temporary compatibility path; it is not the 5,000-record
contract.

Do not switch to vector tiles solely because the global catalog reaches an
arbitrary count. Escalate after the bbox implementation is measured on dense,
representative viewports and still fails any release budget in two repeat runs.
At that point use server-side vector tiles so Mapbox loads only visible features;
keep saved/selected overlays in a small separate dynamic source. Low-zoom
clustering is optional only when aggregate counts improve comprehension; it
does not replace the category-diverse relevance rules.

## Gate 4 Evidence

Gate 4 cannot pass until all of the following are recorded:

- production endpoint returns all `853` currently public records before any
  subsequent approved publication changes;
- bbox and cursor contracts have SQL/index plans and RLS-safe tests;
- payload and latency budgets pass representative sparse and dense viewports;
- saved, selected, searched, and safety-promoted resources survive suppression;
- list pagination proves full discoverability without duplicate or missing IDs;
- stale requests cannot overwrite newer pan, zoom, or search results;
- mobile main-thread and marker-density budgets pass; and
- cache revalidation cannot serve unpublished or stale promoted records beyond
  the accepted public-cache age.

## Scope Boundary

This document closes Research 4. It does not implement Batch 4, alter `/find`
UI, fetch or publish sources, change production data, or authorize deployment.
Screenshots are still required before the planned Batch 5 `/find` UI build.
