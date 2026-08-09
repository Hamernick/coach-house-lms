# Public map marker relevance

## Goal

Keep `/find` useful at every zoom without drawing every resource pin at once or
making any resource undiscoverable.

## Decision

Keep the complete catalog in one Mapbox WebGL GeoJSON source and progressively
filter the pin layer by deterministic relevance tiers. This preserves the
current pin design and avoids DOM-marker overhead.

| Zoom           | Map detail        | Selection rule                                                   |
| -------------- | ----------------- | ---------------------------------------------------------------- |
| Below 7        | Regional overview | One representative per top-level category and regional tile      |
| 7 to below 10  | City overview     | Add one representative per category and city tile                |
| 10 to below 15 | Neighborhood      | Add up to two representatives per category and neighborhood tile |
| 15 and above   | Full detail       | Show every resource in the viewport                              |

Saved and selected locations bypass relevance filtering at every zoom. When a
user shares location access, the nearest resource wins each local category's
representative slot. Search, category filters, and the drawer continue to use
the full result set.

## Alternatives considered

- Reintroduce custom clusters: strong density summaries, but conflicts with the
  current unified pin direction and adds a second marker visual language.
- Use collision placement alone: simpler, but it can hide whole categories and
  gives no deterministic zoom behavior.
- Move immediately to vector tiles: appropriate for a much larger catalog, but
  unnecessary for the current 4,734-feature WebGL source.

## Performance and accessibility

- Relevance is computed once when the catalog, saved set, theme, or user
  location changes; map movement only switches a layer filter at zoom-end.
- Normal pin labels remain collision-aware. Saved and selected pins remain
  visible and retain the existing keyboard-accessible list/detail paths.
- Marker selection, same-location groups, category filters, and search keep
  their existing behavior.

## Verification

- Pure tests cover progressive counts, category diversity, nearest-user
  ranking, saved same-location groups, filters, and zoom thresholds.
- Browser checks cover the real 4,734-feature source, active layer contracts,
  zoom changes, and page/console errors.
