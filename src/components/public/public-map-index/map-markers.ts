import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { PUBLIC_MAP_GROUP_ACCENTS } from "@/lib/public-map/groups"

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "O"
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

export const ORGANIZATION_MARKER_OFFSET_Y = -12
const PUBLIC_MAP_MARKER_REACT_GRAB_SOURCE =
  "src/components/public/public-map-index/map-markers.ts"
const PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT = "PublicMapOrganizationMarker"

function resolveAccent(primaryGroup: PublicMapOrganization["primaryGroup"]) {
  return PUBLIC_MAP_GROUP_ACCENTS[primaryGroup] ?? PUBLIC_MAP_GROUP_ACCENTS.community
}

function applyMarkerSelectionStyles({
  button,
  selected,
  accent,
}: {
  button: HTMLButtonElement
  selected: boolean
  accent: string
}) {
  const avatar = button.querySelector<HTMLElement>('[data-marker-part="avatar"]')
  const fallback = button.querySelector<HTMLElement>('[data-marker-part="fallback"]')
  const label = button.querySelector<HTMLElement>('[data-marker-part="label"]')
  if (!avatar || !fallback || !label) return

  avatar.style.width = selected ? "48px" : "42px"
  avatar.style.height = selected ? "48px" : "42px"
  avatar.style.border = selected ? `2px solid ${accent}` : "2px solid rgba(255, 255, 255, 0.78)"
  avatar.style.boxShadow = selected ? "0 10px 26px rgba(8, 15, 40, 0.48)" : "0 3px 12px rgba(8, 15, 40, 0.34)"
  fallback.style.fontSize = selected ? "13px" : "12px"

  label.style.fontWeight = selected ? "700" : "600"
  label.style.border = selected ? `1px solid ${accent}` : "1px solid rgba(255, 255, 255, 0.28)"
  label.style.background = selected ? "rgba(14, 24, 43, 0.96)" : "rgba(8, 15, 40, 0.84)"
  button.dataset.selected = selected ? "true" : "false"
}

function syncMarkerAvatarImage({
  button,
  organization,
}: {
  button: HTMLButtonElement
  organization: PublicMapOrganization
}) {
  const avatar = button.querySelector<HTMLElement>('[data-marker-part="avatar"]')
  const fallback = button.querySelector<HTMLElement>('[data-marker-part="fallback"]')
  if (!avatar || !fallback) return

  const imageSource = organization.logoUrl?.trim() || organization.headerUrl?.trim() || ""
  const existingImage = avatar.querySelector<HTMLImageElement>('[data-marker-part="image"]')

  if (imageSource.length === 0) {
    existingImage?.remove()
    fallback.style.display = "inline-flex"
    return
  }

  if (existingImage && existingImage.dataset.src === imageSource) {
    if (existingImage.complete && existingImage.naturalWidth > 0) {
      existingImage.style.display = "block"
      fallback.style.display = "none"
    }
    return
  }

  existingImage?.remove()

  const image = document.createElement("img")
  image.dataset.markerPart = "image"
  image.dataset.src = imageSource
  image.alt = ""
  image.loading = "lazy"
  image.style.width = "100%"
  image.style.height = "100%"
  image.style.objectFit = "cover"
  image.style.display = "none"
  image.addEventListener("load", () => {
    image.style.display = "block"
    fallback.style.display = "none"
  })
  image.addEventListener("error", () => {
    image.remove()
    fallback.style.display = "inline-flex"
  })
  image.src = imageSource
  avatar.insertBefore(image, fallback)

  if (image.complete && image.naturalWidth > 0) {
    image.style.display = "block"
    fallback.style.display = "none"
  }
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

  const accent = resolveAccent(organization.primaryGroup)
  const label = element.querySelector<HTMLElement>('[data-marker-part="label"]')
  if (label) {
    label.textContent = organization.name
  }
  element.title = organization.name
  element.ariaLabel = `Open ${organization.name}`
  syncMarkerAvatarImage({ button: element, organization })
  applyMarkerSelectionStyles({ button: element, selected, accent })
}

export function createOrganizationMarkerElement({
  organization,
  selected,
  onSelect,
}: {
  organization: PublicMapOrganization
  selected: boolean
  onSelect: () => void
}) {
  const accent = resolveAccent(organization.primaryGroup)
  const button = document.createElement("button")
  button.type = "button"
  button.title = organization.name
  button.ariaLabel = `Open ${organization.name}`
  button.onclick = onSelect
  button.style.border = "0"
  button.style.padding = "0"
  button.style.background = "transparent"
  button.style.cursor = "pointer"
  button.style.display = "flex"
  button.style.flexDirection = "column"
  button.style.alignItems = "center"
  button.style.gap = "5px"
  button.style.minWidth = "124px"
  button.style.maxWidth = "132px"
  attachMarkerReactGrabMetadata({
    button,
    organizationId: organization.id,
  })

  const avatar = document.createElement("span")
  avatar.dataset.markerPart = "avatar"
  avatar.style.display = "inline-flex"
  avatar.style.alignItems = "center"
  avatar.style.justifyContent = "center"
  avatar.style.overflow = "hidden"
  avatar.style.borderRadius = "9999px"
  avatar.style.width = "42px"
  avatar.style.height = "42px"
  avatar.style.border = "2px solid rgba(255, 255, 255, 0.78)"
  avatar.style.background = "rgba(17, 24, 39, 0.88)"
  avatar.style.boxShadow = "0 3px 12px rgba(8, 15, 40, 0.34)"

  const fallback = document.createElement("span")
  fallback.dataset.markerPart = "fallback"
  fallback.textContent = buildInitials(organization.name)
  fallback.style.color = "rgba(248, 250, 252, 0.98)"
  fallback.style.fontSize = "12px"
  fallback.style.fontWeight = "700"
  fallback.style.letterSpacing = "0.01em"
  avatar.append(fallback)

  const label = document.createElement("span")
  label.dataset.markerPart = "label"
  label.textContent = organization.name
  label.style.display = "inline-block"
  label.style.maxWidth = "130px"
  label.style.whiteSpace = "nowrap"
  label.style.overflow = "hidden"
  label.style.textOverflow = "ellipsis"
  label.style.borderRadius = "9999px"
  label.style.padding = "2px 7px"
  label.style.fontSize = "11px"
  label.style.fontWeight = "600"
  label.style.lineHeight = "1.2"
  label.style.color = "rgba(248, 250, 252, 0.98)"
  label.style.border = "1px solid rgba(255, 255, 255, 0.28)"
  label.style.background = "rgba(8, 15, 40, 0.84)"
  label.style.boxShadow = "0 4px 10px rgba(8, 15, 40, 0.26)"

  button.append(avatar, label)
  syncMarkerAvatarImage({ button, organization })
  applyMarkerSelectionStyles({ button, selected, accent })
  return button
}
