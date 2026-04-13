import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  buildMarkerInitials,
  createMarkerFallbackLabel,
  syncMarkerAvatarImage,
} from "./marker-avatar-content"
import {
  bindMarkerActivation,
  bindMarkerInteractionState,
  type MarkerInteractionState,
} from "./marker-interaction-utils"
import {
  createMarkerImageSurface,
  ensureMarkerShimmerStyles,
  MARKER_FALLBACK_COLOR,
} from "./marker-image-loading"
import {
  CLUSTER_PREVIEW_MAX_MEMBERS,
} from "./cluster-avatar-layout"

export {
  CLUSTER_GLYPH_SIZE,
  CLUSTER_PREVIEW_MAX_MEMBERS,
  resolveClusterAvatarLayout,
} from "./cluster-avatar-layout"
export {
  createOrganizationClusterMarkerElement,
  updateOrganizationClusterMarkerElement,
} from "./cluster-marker-elements"

export const ORGANIZATION_MARKER_OFFSET_Y = 0
export const ORGANIZATION_CLUSTER_MARKER_OFFSET_Y = 0
const PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE =
  "src/components/public/public-map-index/map-markers.ts"
const PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT = "PublicMapOrganizationMarker"
const ORGANIZATION_MARKER_IDLE_SIZE = 28
const ORGANIZATION_MARKER_HOVER_SIZE = 31
const ORGANIZATION_MARKER_SELECTED_SIZE = 34
const ORGANIZATION_MARKER_SELECTED_HOVER_SIZE = 37
const ORGANIZATION_MARKER_IDLE_SHADOW = "0 8px 18px rgba(8, 15, 40, 0.28)"
const ORGANIZATION_MARKER_HOVER_SHADOW = "0 11px 22px rgba(8, 15, 40, 0.34)"
const ORGANIZATION_MARKER_SELECTED_SHADOW = "0 12px 24px rgba(8, 15, 40, 0.4)"
const ORGANIZATION_MARKER_SELECTED_HOVER_SHADOW = "0 16px 30px rgba(8, 15, 40, 0.48)"
const ORGANIZATION_MARKER_PRESSED_SHADOW = "0 8px 18px rgba(8, 15, 40, 0.3)"
const ORGANIZATION_MARKER_IDLE_BORDER = "2px solid rgba(255, 255, 255, 0.86)"
const ORGANIZATION_MARKER_HOVER_BORDER = "2px solid rgba(255, 255, 255, 0.94)"
const ORGANIZATION_MARKER_SELECTED_BORDER = "2px solid rgba(255, 255, 255, 0.98)"
const ORGANIZATION_MARKER_PRESSED_BORDER = "2px solid rgba(255, 255, 255, 1)"
const ORGANIZATION_MARKER_IDLE_BACKGROUND = "rgba(17, 24, 39, 0.88)"
const ORGANIZATION_MARKER_HOVER_BACKGROUND =
  "linear-gradient(180deg, rgba(27, 38, 60, 0.95), rgba(15, 23, 42, 0.95))"
const ORGANIZATION_MARKER_SELECTED_BACKGROUND =
  "linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))"
const ORGANIZATION_MARKER_SELECTED_HOVER_BACKGROUND =
  "linear-gradient(180deg, rgba(37, 52, 78, 0.98), rgba(15, 23, 42, 0.98))"

export const PUBLIC_MAP_MARKER_PILL_STYLE = {
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

export type { ClusterMarkerPreviewMember } from "./cluster-marker-elements"

type OrganizationMarkerVisualStyle = {
  size: number
  border: string
  background: string
  boxShadow: string
  buttonTransform: string
  fontSize: string
}

export function resolveOrganizationMarkerState({
  selected,
  interactionState,
}: {
  selected: boolean
  interactionState: MarkerInteractionState
}) {
  return selected ? "selected" : interactionState
}

export function resolveOrganizationMarkerAvatarStyles({
  selected,
  interactionState,
}: {
  selected: boolean
  interactionState: MarkerInteractionState
}): OrganizationMarkerVisualStyle {
  if (selected) {
    if (interactionState === "pressed") {
      return {
        size: ORGANIZATION_MARKER_SELECTED_SIZE,
        border: ORGANIZATION_MARKER_PRESSED_BORDER,
        background: ORGANIZATION_MARKER_SELECTED_BACKGROUND,
        boxShadow: ORGANIZATION_MARKER_PRESSED_SHADOW,
        buttonTransform: "translateY(0px) scale(1.01)",
        fontSize: "11px",
      }
    }
    if (interactionState === "hover") {
      return {
        size: ORGANIZATION_MARKER_SELECTED_HOVER_SIZE,
        border: ORGANIZATION_MARKER_SELECTED_BORDER,
        background: ORGANIZATION_MARKER_SELECTED_HOVER_BACKGROUND,
        boxShadow: ORGANIZATION_MARKER_SELECTED_HOVER_SHADOW,
        buttonTransform: "translateY(-2px) scale(1.05)",
        fontSize: "11px",
      }
    }
    return {
      size: ORGANIZATION_MARKER_SELECTED_SIZE,
      border: ORGANIZATION_MARKER_SELECTED_BORDER,
      background: ORGANIZATION_MARKER_SELECTED_BACKGROUND,
      boxShadow: ORGANIZATION_MARKER_SELECTED_SHADOW,
      buttonTransform: "translateY(-1px) scale(1.02)",
      fontSize: "11px",
    }
  }

  if (interactionState === "pressed") {
    return {
      size: ORGANIZATION_MARKER_IDLE_SIZE,
      border: ORGANIZATION_MARKER_PRESSED_BORDER,
      background: ORGANIZATION_MARKER_HOVER_BACKGROUND,
      boxShadow: ORGANIZATION_MARKER_PRESSED_SHADOW,
      buttonTransform: "translateY(0px) scale(0.97)",
      fontSize: "10px",
    }
  }
  if (interactionState === "hover") {
    return {
      size: ORGANIZATION_MARKER_HOVER_SIZE,
      border: ORGANIZATION_MARKER_HOVER_BORDER,
      background: ORGANIZATION_MARKER_HOVER_BACKGROUND,
      boxShadow: ORGANIZATION_MARKER_HOVER_SHADOW,
      buttonTransform: "translateY(-1px) scale(1.04)",
      fontSize: "10px",
    }
  }
  return {
    size: ORGANIZATION_MARKER_IDLE_SIZE,
    border: ORGANIZATION_MARKER_IDLE_BORDER,
    background: ORGANIZATION_MARKER_IDLE_BACKGROUND,
    boxShadow: ORGANIZATION_MARKER_IDLE_SHADOW,
    buttonTransform: "translateY(0px) scale(1)",
    fontSize: "10px",
  }
}

function applyMarkerSelectionStyles({
  button,
  selected,
  interactionState,
}: {
  button: HTMLButtonElement
  selected: boolean
  interactionState: MarkerInteractionState
}) {
  const avatar = button.querySelector<HTMLElement>('[data-marker-part="avatar"]')
  const fallback = button.querySelector<HTMLElement>('[data-marker-part="fallback"]')
  if (!avatar || !fallback) return

  const styles = resolveOrganizationMarkerAvatarStyles({
    selected,
    interactionState,
  })
  avatar.style.width = `${styles.size}px`
  avatar.style.height = `${styles.size}px`
  avatar.style.border = styles.border
  avatar.style.boxShadow = styles.boxShadow
  avatar.style.background = styles.background
  fallback.style.fontSize = styles.fontSize
  button.style.transform = styles.buttonTransform
  button.style.zIndex = selected ? "3" : interactionState === "hover" ? "2" : "1"
  button.dataset.selected = selected ? "true" : "false"
  button.dataset.markerState = resolveOrganizationMarkerState({
    selected,
    interactionState,
  })
}

export function buildPublicMapMarkerReactGrabMetadata(organizationId: string) {
  if (process.env.NODE_ENV === "production") return

  const ownerId = `public-map-marker:${organizationId}`
  return {
    "data-react-grab-anchor": PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT,
    "data-react-grab-owner-id": ownerId,
    "data-react-grab-link-id": ownerId,
    "data-react-grab-owner-component": PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT,
    "data-react-grab-surface-component": PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT,
    "data-react-grab-owner-source": PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE,
    "data-react-grab-surface-source": PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE,
    "data-react-grab-owner-slot": "marker",
    "data-react-grab-surface-slot": "marker",
    "data-react-grab-surface-kind": "root",
  } as const
}

function attachMarkerReactGrabMetadata({
  button,
  organizationId,
}: {
  button: HTMLButtonElement
  organizationId: string
}) {
  const metadata = buildPublicMapMarkerReactGrabMetadata(organizationId)
  if (!metadata) return

  for (const [key, value] of Object.entries(metadata)) {
    button.setAttribute(key, value)
  }
}

export function updateOrganizationMarkerElement({
  element,
  organization,
  selected,
}: {
  element: HTMLElement
  organization: PublicMapOrganization
  selected: boolean
}) {
  if (!(element instanceof HTMLButtonElement)) return

  element.title = organization.name
  element.ariaLabel = `Open ${organization.name}`
  syncMarkerAvatarImage({ button: element, organization })
  const interactionState =
    element.dataset.interactionState === "hover" || element.dataset.interactionState === "pressed"
      ? element.dataset.interactionState
      : "idle"
  applyMarkerSelectionStyles({
    button: element,
    selected,
    interactionState,
  })
}

export function createOrganizationMarkerElement({
  organization,
  selected,
  placement = "default",
  onSelect,
}: {
  organization: PublicMapOrganization
  selected: boolean
  placement?: "default" | "spiderfied"
  onSelect: () => void
}) {
  ensureMarkerShimmerStyles()
  const button = document.createElement("button")
  button.type = "button"
  button.title = organization.name
  button.ariaLabel = `Open ${organization.name}`
  bindMarkerActivation({
    button,
    onActivate: onSelect,
  })
  button.style.border = "0"
  button.style.padding = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"
  button.style.display = "inline-flex"
  button.style.alignItems = "center"
  button.style.justifyContent = "center"
  button.style.position = "relative"
  button.style.width = "40px"
  button.style.height = "40px"
  button.style.minWidth = "40px"
  button.style.minHeight = "40px"
  button.style.outline = "none"
  button.style.transformOrigin = "center center"
  button.style.transition = "transform 160ms ease"
  button.style.pointerEvents = "auto"
  button.style.touchAction = "manipulation"
  button.style.setProperty("-webkit-tap-highlight-color", "transparent")
  button.style.userSelect = "none"
  button.style.overflow = "visible"
  button.dataset.interactionState = "idle"
  button.dataset.markerPlacement = placement
  attachMarkerReactGrabMetadata({
    button,
    organizationId: organization.id,
  })

  const avatar = document.createElement("span")
  avatar.dataset.markerPart = "avatar"
  avatar.style.display = "inline-flex"
  avatar.style.position = "relative"
  avatar.style.alignItems = "center"
  avatar.style.justifyContent = "center"
  avatar.style.overflow = "hidden"
  avatar.style.borderRadius = "9999px"
  avatar.style.width = `${ORGANIZATION_MARKER_IDLE_SIZE}px`
  avatar.style.height = `${ORGANIZATION_MARKER_IDLE_SIZE}px`
  avatar.style.border = ORGANIZATION_MARKER_IDLE_BORDER
  avatar.style.background = ORGANIZATION_MARKER_IDLE_BACKGROUND
  avatar.style.boxShadow = ORGANIZATION_MARKER_IDLE_SHADOW
  avatar.style.pointerEvents = "none"

  createMarkerImageSurface({
    container: avatar,
  })

  const fallback = createMarkerFallbackLabel({
    text: buildMarkerInitials(organization.name),
    fontSize: "10px",
    color: MARKER_FALLBACK_COLOR,
  })
  fallback.dataset.markerPart = "fallback"
  avatar.append(fallback)

  button.append(avatar)
  bindMarkerInteractionState({
    button,
    onStateChange: (interactionState) => {
      applyMarkerSelectionStyles({
        button,
        selected: button.dataset.selected === "true",
        interactionState,
      })
    },
  })
  syncMarkerAvatarImage({ button, organization })
  applyMarkerSelectionStyles({
    button,
    selected,
    interactionState: "idle",
  })
  return button
}
