const MARKER_IMAGE_SURFACE_BACKGROUND =
  "linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(226, 232, 240, 0.9))"
const MARKER_IMAGE_SURFACE_INSET_SHADOW =
  "inset 0 0 0 1px rgba(148, 163, 184, 0.14)"
const MARKER_SHIMMER_STYLE_ID = "public-map-marker-shimmer-style"
const loadedMarkerImageSources = new Set<string>()
const failedMarkerImageSources = new Set<string>()

export const MARKER_FALLBACK_COLOR = "rgba(15, 23, 42, 0.9)"

export function ensureMarkerShimmerStyles() {
  if (typeof document === "undefined") return
  if (document.getElementById(MARKER_SHIMMER_STYLE_ID)) return

  const style = document.createElement("style")
  style.id = MARKER_SHIMMER_STYLE_ID
  style.textContent = `
    @keyframes public-map-marker-shimmer {
      0% { transform: translateX(-135%); }
      100% { transform: translateX(135%); }
    }
  `
  document.head.append(style)
}

export function createMarkerImageSurface({
  container,
}: {
  container: HTMLElement
}) {
  const surface = document.createElement("span")
  surface.dataset.markerPart = "image-surface"
  surface.style.position = "absolute"
  surface.style.inset = "0"
  surface.style.borderRadius = "inherit"
  surface.style.background = MARKER_IMAGE_SURFACE_BACKGROUND
  surface.style.boxShadow = MARKER_IMAGE_SURFACE_INSET_SHADOW
  surface.style.pointerEvents = "none"

  const shimmer = document.createElement("span")
  shimmer.dataset.markerPart = "loading-shimmer"
  shimmer.style.position = "absolute"
  shimmer.style.inset = "0"
  shimmer.style.overflow = "hidden"
  shimmer.style.borderRadius = "inherit"
  shimmer.style.pointerEvents = "none"
  shimmer.style.opacity = "0"
  shimmer.style.transition = "opacity 160ms ease"

  const shimmerBand = document.createElement("span")
  shimmerBand.dataset.markerPart = "loading-shimmer-band"
  shimmerBand.style.position = "absolute"
  shimmerBand.style.top = "0"
  shimmerBand.style.bottom = "0"
  shimmerBand.style.left = "-140%"
  shimmerBand.style.width = "72%"
  shimmerBand.style.background =
    "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.72), rgba(255,255,255,0))"
  shimmerBand.style.transform = "translateX(-135%)"
  shimmerBand.style.animation = "public-map-marker-shimmer 1.15s linear infinite"
  shimmer.append(shimmerBand)

  container.append(surface, shimmer)
  return {
    shimmer,
  }
}

export function setMarkerImageLoadingState({
  shimmer,
  loading,
}: {
  shimmer: HTMLElement | null
  loading: boolean
}) {
  if (!shimmer) return
  shimmer.style.opacity = loading ? "1" : "0"
}

export function resolveMarkerImageCacheState(source: string) {
  if (loadedMarkerImageSources.has(source)) return "loaded"
  if (failedMarkerImageSources.has(source)) return "failed"
  return "pending"
}

export function markMarkerImageLoaded(source: string) {
  loadedMarkerImageSources.add(source)
  failedMarkerImageSources.delete(source)
}

export function markMarkerImageFailed(source: string) {
  failedMarkerImageSources.add(source)
}
