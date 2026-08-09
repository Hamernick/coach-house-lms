# Public map marker archive — 2026-08-02

The complete pre-redesign `/find` implementation is preserved at:

- Ref: `refs/codex/snapshots/find-markers-before-20260802T143539`
- Commit: `c04e53d626944f665c2fe5539e07abb7bd8450ae`

The snapshot includes the custom cluster worker/client, cluster sprites and
layout, cluster click behavior, WebGL cluster layers, circular individual
marker canvases, special cooling-center capsules, marker image loaders, and
their acceptance tests.

Primary archived entry points:

- `src/components/public/public-map-index/use-public-map-clustered-markers.ts`
- `src/components/public/public-map-index/public-map-cluster-runtime.ts`
- `src/components/public/public-map-index/map-layer-contracts.ts`
- `src/components/public/public-map-index/map-layer-sync.ts`
- `src/lib/public-map/public-map-cluster-client.ts`
- `src/lib/public-map/public-map-cluster.worker.ts`
- `src/lib/public-map/public-map-cluster-sprites.ts`
- `src/lib/public-map/public-map-marker-canvas.ts`
- `src/lib/public-map/public-map-marker-style.ts`
- `src/lib/public-map/public-map-special-marker-canvas.ts`

Inspect any archived file without changing the working tree:

```sh
git show refs/codex/snapshots/find-markers-before-20260802T143539:<path>
```
