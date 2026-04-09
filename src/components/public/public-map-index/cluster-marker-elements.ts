import {
  bindClusterMarkerInteractionState,
  bindMarkerActivation,
} from "./marker-interaction-utils"
import { CLUSTER_GLYPH_HOUSING_SIZE, CLUSTER_GLYPH_SIZE, resolveClusterAvatarLayout } from "./cluster-avatar-layout"
import {
  createMarkerImageSurface,
  ensureMarkerShimmerStyles,
  MARKER_FALLBACK_COLOR,
  markMarkerImageFailed,
  markMarkerImageLoaded,
  resolveMarkerImageCacheState,
  setMarkerImageLoadingState,
} from "./marker-image-loading"
import {
  buildMarkerInitials,
  createMarkerFallbackLabel,
} from "./marker-avatar-content"

const PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE =
  "src/components/public/public-map-index/map-markers.ts"
const PUBLIC_MAP_CLUSTER_MARKER_REACT_GRAB_COMPONENT =
  "PublicMapOrganizationClusterMarker"
const CLUSTER_MARKER_GLASS_BLUR = "blur(13px) saturate(150%)"
const CLUSTER_BUBBLE_BASE_BACKGROUND = "rgba(11, 21, 40, 0.68)"
const CLUSTER_GLYPH_HOUSING_BACKGROUND = "rgba(16, 25, 42, 0.76)"
const CLUSTER_GLYPH_HOUSING_BORDER = "1px solid rgba(209, 214, 222, 0.58)"
const CLUSTER_HIT_TARGET_SIZE = CLUSTER_GLYPH_HOUSING_SIZE
const CLUSTER_GLYPH_SHELL_IDLE_SHADOW = "0 10px 22px rgba(8, 15, 40, 0.34)"
const CLUSTER_GLYPH_SHELL_ACTIVE_SHADOW = "0 14px 28px rgba(8, 15, 40, 0.46)"
const CLUSTER_COUNT_IDLE_BACKGROUND = "rgba(8, 15, 40, 0.84)"
const CLUSTER_COUNT_ACTIVE_BACKGROUND = "rgba(12, 21, 42, 0.96)"

const PUBLIC_MAP_MARKER_PILL_STYLE = {
  borderRadius: "9999px",
  padding: "2px 7px",
  fontSize: "11px",
  fontWeight: "600",
  lineHeight: "1.2",
  color: "rgba(248, 250, 252, 0.98)",
  border: "1px solid rgba(255, 255, 255, 0.28)",
  background: "rgba(8, 15, 40, 0.84)",
  boxShadow: "0 4px 10px rgba(8, 15, 40, 0.26)",
} as const

export type ClusterMarkerPreviewMember = {
  id: string
  name: string
  imageUrl: string | null
}

function applyMarkerPillBaseStyles(node: HTMLElement) {
  node.style.display = "inline-flex"
  node.style.alignItems = "center"
  node.style.justifyContent = "center"
  node.style.borderRadius = PUBLIC_MAP_MARKER_PILL_STYLE.borderRadius
  node.style.padding = PUBLIC_MAP_MARKER_PILL_STYLE.padding
  node.style.fontSize = PUBLIC_MAP_MARKER_PILL_STYLE.fontSize
  node.style.fontWeight = PUBLIC_MAP_MARKER_PILL_STYLE.fontWeight
  node.style.lineHeight = PUBLIC_MAP_MARKER_PILL_STYLE.lineHeight
  node.style.color = PUBLIC_MAP_MARKER_PILL_STYLE.color
  node.style.border = PUBLIC_MAP_MARKER_PILL_STYLE.border
  node.style.background = PUBLIC_MAP_MARKER_PILL_STYLE.background
  node.style.boxShadow = PUBLIC_MAP_MARKER_PILL_STYLE.boxShadow
}

function applyClusterBubbleGlyph({
  glyph,
  pointCount,
  previewMembers,
}: {
  glyph: HTMLElement
  pointCount: number
  previewMembers: ClusterMarkerPreviewMember[]
}) {
  glyph.replaceChildren()
  ensureMarkerShimmerStyles()
  const bubbles = resolveClusterAvatarLayout(
    Math.max(1, previewMembers.length || pointCount),
  )
  bubbles.forEach((bubble, index) => {
    const node = document.createElement("span")
    node.style.pointerEvents = "none"
    node.style.position = "absolute"
    node.style.left = `${bubble.left}px`
    node.style.top = `${bubble.top}px`
    node.style.width = `${bubble.size}px`
    node.style.height = `${bubble.size}px`
    node.style.borderRadius = "9999px"
    node.style.boxSizing = "border-box"
    node.style.padding = "1px"
    node.style.overflow = "hidden"
    node.style.zIndex = `${bubble.zIndex}`
    node.style.border = "1px solid rgba(255, 255, 255, 0.44)"
    node.style.background = `linear-gradient(160deg, rgba(255, 255, 255, 0.18), ${CLUSTER_BUBBLE_BASE_BACKGROUND})`
    node.style.opacity = `${bubble.alpha}`
    node.style.boxShadow = "0 6px 14px rgba(8, 15, 40, 0.28)"
    node.style.backdropFilter = CLUSTER_MARKER_GLASS_BLUR
    node.style.setProperty("-webkit-backdrop-filter", CLUSTER_MARKER_GLASS_BLUR)

    const imageFrame = document.createElement("span")
    imageFrame.style.position = "absolute"
    imageFrame.style.inset = "1px"
    imageFrame.style.display = "inline-flex"
    imageFrame.style.alignItems = "center"
    imageFrame.style.justifyContent = "center"
    imageFrame.style.borderRadius = "inherit"
    imageFrame.style.overflow = "hidden"
    imageFrame.style.pointerEvents = "none"

    const { shimmer } = createMarkerImageSurface({
      container: imageFrame,
    })
    node.append(imageFrame)

    const preview = previewMembers[index]
    const fallbackFontSize = `${Math.max(10, Math.round(bubble.size * 0.36))}px`
    const fallbackLabel = preview?.name
      ? createMarkerFallbackLabel({
          text: buildMarkerInitials(preview.name),
          fontSize: fallbackFontSize,
          color: MARKER_FALLBACK_COLOR,
        })
      : null
    if (fallbackLabel) {
      imageFrame.append(fallbackLabel)
    }

    if (preview?.imageUrl) {
      const cachedState = resolveMarkerImageCacheState(preview.imageUrl)
      if (cachedState === "failed") {
        setMarkerImageLoadingState({
          shimmer,
          loading: false,
        })
        glyph.append(node)
        return
      }

      const image = document.createElement("img")
      image.alt = ""
      image.loading = "eager"
      image.decoding = "async"
      image.src = preview.imageUrl
      image.style.width = "100%"
      image.style.height = "100%"
      image.style.objectFit = "cover"
      image.style.borderRadius = "9999px"
      image.style.position = "relative"
      image.style.zIndex = "1"
      image.style.display = "none"
      setMarkerImageLoadingState({
        shimmer,
        loading: cachedState !== "loaded",
      })
      image.addEventListener("load", () => {
        markMarkerImageLoaded(preview.imageUrl!)
        image.style.display = "block"
        fallbackLabel?.remove()
        setMarkerImageLoadingState({
          shimmer,
          loading: false,
        })
      })
      image.addEventListener("error", () => {
        markMarkerImageFailed(preview.imageUrl!)
        image.remove()
        setMarkerImageLoadingState({
          shimmer,
          loading: false,
        })
      })
      imageFrame.append(image)
      if (cachedState === "loaded" || (image.complete && image.naturalWidth > 0)) {
        markMarkerImageLoaded(preview.imageUrl)
        image.style.display = "block"
        fallbackLabel?.remove()
        setMarkerImageLoadingState({
          shimmer,
          loading: false,
        })
      }
    } else {
      setMarkerImageLoadingState({
        shimmer,
        loading: false,
      })
    }

    glyph.append(node)
  })
}

function buildPublicMapClusterMarkerReactGrabMetadata(clusterId: number) {
  if (process.env.NODE_ENV === "production") return

  const ownerId = `public-map-cluster-marker:${clusterId}`
  return {
    "data-react-grab-anchor": PUBLIC_MAP_CLUSTER_MARKER_REACT_GRAB_COMPONENT,
    "data-react-grab-owner-id": ownerId,
    "data-react-grab-link-id": ownerId,
    "data-react-grab-owner-component": PUBLIC_MAP_CLUSTER_MARKER_REACT_GRAB_COMPONENT,
    "data-react-grab-surface-component": PUBLIC_MAP_CLUSTER_MARKER_REACT_GRAB_COMPONENT,
    "data-react-grab-owner-source": PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE,
    "data-react-grab-surface-source": PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE,
    "data-react-grab-owner-slot": "cluster-marker",
    "data-react-grab-surface-slot": "cluster-marker",
    "data-react-grab-surface-kind": "root",
  } as const
}

function attachClusterMarkerReactGrabMetadata({
  button,
  clusterId,
}: {
  button: HTMLButtonElement
  clusterId: number
}) {
  const metadata = buildPublicMapClusterMarkerReactGrabMetadata(clusterId)
  if (!metadata) return

  for (const [key, value] of Object.entries(metadata)) {
    button.setAttribute(key, value)
  }
}

export function updateOrganizationClusterMarkerElement({
  element,
  pointCount,
  previewMembers = [],
}: {
  element: HTMLElement
  pointCount: number
  previewMembers?: ClusterMarkerPreviewMember[]
}) {
  if (!(element instanceof HTMLButtonElement)) return
  const glyph = element.querySelector<HTMLElement>('[data-marker-part="glyph"]')
  if (glyph) {
    applyClusterBubbleGlyph({
      glyph,
      pointCount,
      previewMembers,
    })
  }
  const count = element.querySelector<HTMLElement>('[data-marker-part="count"]')
  if (count) {
    count.textContent = pointCount.toLocaleString()
  }
  element.ariaLabel = `Zoom into ${pointCount.toLocaleString()} organizations`
}

export function createOrganizationClusterMarkerElement({
  clusterId,
  pointCount,
  previewMembers = [],
  onSelect,
}: {
  clusterId: number
  pointCount: number
  previewMembers?: ClusterMarkerPreviewMember[]
  onSelect?: (() => void) | null
}) {
  const button = document.createElement("button")
  button.type = "button"
  if (onSelect) {
    bindMarkerActivation({
      button,
      onActivate: onSelect,
    })
  }
  button.ariaLabel = `Zoom into ${pointCount.toLocaleString()} organizations`
  button.style.border = "0"
  button.style.padding = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"
  button.style.display = "inline-flex"
  button.style.position = "relative"
  button.style.alignItems = "center"
  button.style.justifyContent = "center"
  button.style.width = `${CLUSTER_HIT_TARGET_SIZE}px`
  button.style.height = `${CLUSTER_HIT_TARGET_SIZE}px`
  button.style.minWidth = `${CLUSTER_HIT_TARGET_SIZE}px`
  button.style.minHeight = `${CLUSTER_HIT_TARGET_SIZE}px`
  button.style.color = "rgba(248, 250, 252, 0.98)"
  button.style.outline = "none"
  button.style.pointerEvents = onSelect ? "auto" : "none"
  button.style.touchAction = "manipulation"
  button.style.setProperty("-webkit-tap-highlight-color", "transparent")
  button.style.userSelect = "none"
  button.style.overflow = "visible"
  attachClusterMarkerReactGrabMetadata({
    button,
    clusterId,
  })

  const glyphShell = document.createElement("span")
  glyphShell.dataset.markerPart = "glyph-shell"
  glyphShell.style.display = "inline-flex"
  glyphShell.style.alignItems = "center"
  glyphShell.style.justifyContent = "center"
  glyphShell.style.width = `${CLUSTER_GLYPH_HOUSING_SIZE}px`
  glyphShell.style.height = `${CLUSTER_GLYPH_HOUSING_SIZE}px`
  glyphShell.style.borderRadius = "9999px"
  glyphShell.style.border = CLUSTER_GLYPH_HOUSING_BORDER
  glyphShell.style.background = CLUSTER_GLYPH_HOUSING_BACKGROUND
  glyphShell.style.backdropFilter = CLUSTER_MARKER_GLASS_BLUR
  glyphShell.style.setProperty("-webkit-backdrop-filter", CLUSTER_MARKER_GLASS_BLUR)
  glyphShell.style.boxShadow = CLUSTER_GLYPH_SHELL_IDLE_SHADOW
  glyphShell.style.pointerEvents = "none"
  glyphShell.style.transition =
    "transform 140ms cubic-bezier(0.22,1,0.36,1), box-shadow 140ms ease, border-color 140ms ease"

  const glyph = document.createElement("span")
  glyph.dataset.markerPart = "glyph"
  glyph.style.position = "relative"
  glyph.style.display = "block"
  glyph.style.width = `${CLUSTER_GLYPH_SIZE}px`
  glyph.style.height = `${CLUSTER_GLYPH_SIZE}px`
  glyph.style.borderRadius = "9999px"
  glyph.style.overflow = "hidden"
  glyph.style.pointerEvents = "none"
  applyClusterBubbleGlyph({
    glyph,
    pointCount,
    previewMembers,
  })
  glyphShell.append(glyph)

  const count = document.createElement("span")
  count.dataset.markerPart = "count"
  count.textContent = pointCount.toLocaleString()
  applyMarkerPillBaseStyles(count)
  count.style.position = "absolute"
  count.style.left = "50%"
  count.style.top = "calc(100% - 2px)"
  count.style.transform = "translateX(-50%)"
  count.style.minWidth = "30px"
  count.style.height = "19px"
  count.style.padding = "0 7px"
  count.style.pointerEvents = "none"
  count.style.border = PUBLIC_MAP_MARKER_PILL_STYLE.border
  count.style.background = CLUSTER_COUNT_IDLE_BACKGROUND
  count.style.boxShadow = PUBLIC_MAP_MARKER_PILL_STYLE.boxShadow
  count.style.backdropFilter = CLUSTER_MARKER_GLASS_BLUR
  count.style.setProperty("-webkit-backdrop-filter", CLUSTER_MARKER_GLASS_BLUR)
  count.style.fontWeight = "700"
  count.style.textShadow = "0 1px 1px rgba(3, 7, 18, 0.56)"
  count.style.transition = "background-color 140ms ease, border-color 140ms ease"
  bindClusterMarkerInteractionState({
    button,
    glyphShell,
    count,
    idleShadow: CLUSTER_GLYPH_SHELL_IDLE_SHADOW,
    activeShadow: CLUSTER_GLYPH_SHELL_ACTIVE_SHADOW,
    idleCountBackground: CLUSTER_COUNT_IDLE_BACKGROUND,
    activeCountBackground: CLUSTER_COUNT_ACTIVE_BACKGROUND,
  })

  button.append(glyphShell, count)
  return button
}
