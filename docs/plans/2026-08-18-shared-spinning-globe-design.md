# Shared spinning globe design

## Goal

Use the current `/find` globe and pin language on the public home hero while showing more real markers at the `/find` overview scale. The home globe is passive artwork: it does not accept map interaction, request location, render user location, or expose search and selection behavior.

## Architecture

- `spinning-globe.ts` owns the shared 180-second rotation controller, visibility pausing, user-interruption behavior, and reduced-motion handling.
- `sync-public-map-marker-artwork.ts` owns the shared noninteractive marker image, source, layer, and selection synchronization.
- `/find` keeps its existing user-location, selection, and marker interaction hooks around those shared visual utilities.
- `HomeFindMapMini` initializes Mapbox Standard immediately, uses `interactive: false`, and only installs passive marker artwork and rotation.

## Marker data

- The home preview endpoint reads only published database records and public organizations.
- The local raw candidate preview file is explicitly ignored.
- Synthetic seeds are disabled.
- The response is capped at 36 deterministic, geographically and categorically distributed features.
- The home route does not wait for marker data. The globe renders first and its source updates in place when the cached preview arrives.

## Overview density

At world scale, `/find` may show three real representatives per geographic/category bucket. Stable low-zoom offsets declutter geographically concentrated records; the offsets disappear at zoom 4.5 so closer map views return every pin to its exact coordinate. Low-zoom labels remain hidden until they can be read cleanly.

## Accessibility and failure behavior

- Reduced motion stops rotation while preserving the globe and markers.
- Home never imports the location hook or calls geolocation.
- Rotation pauses while the page is hidden or the hero is offscreen.
- Map failure leaves the stable dark hero background without a generic skeleton or fabricated markers.
- Mapbox attribution and branding remain visible.

## Review boundary

Implementation remains local and uncommitted until visual approval. No push, pull request, merge, deployment, or production mutation is part of the design-review phase.
