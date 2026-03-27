import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  markMarkerImageFailed,
  markMarkerImageLoaded,
  resolveMarkerImageCacheState,
  setMarkerImageLoadingState,
} from "./marker-image-loading"

export function buildMarkerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "O"
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

export function createMarkerFallbackLabel({
  text,
  fontSize,
  color,
}: {
  text: string
  fontSize: string
  color: string
}) {
  const fallback = document.createElement("span")
  fallback.textContent = text
  fallback.style.display = "inline-flex"
  fallback.style.width = "100%"
  fallback.style.height = "100%"
  fallback.style.alignItems = "center"
  fallback.style.justifyContent = "center"
  fallback.style.fontSize = fontSize
  fallback.style.fontWeight = "700"
  fallback.style.color = color
  fallback.style.position = "relative"
  fallback.style.zIndex = "1"
  return fallback
}

export function syncMarkerAvatarImage({
  button,
  organization,
}: {
  button: HTMLButtonElement
  organization: PublicMapOrganization
}) {
  const avatar = button.querySelector<HTMLElement>('[data-marker-part="avatar"]')
  const fallback = button.querySelector<HTMLElement>('[data-marker-part="fallback"]')
  const shimmer = button.querySelector<HTMLElement>('[data-marker-part="loading-shimmer"]')
  if (!avatar || !fallback) return

  const imageSource = organization.logoUrl?.trim() || organization.headerUrl?.trim() || ""
  const existingImage = avatar.querySelector<HTMLImageElement>('[data-marker-part="image"]')
  const cachedState = imageSource ? resolveMarkerImageCacheState(imageSource) : "pending"

  if (imageSource.length === 0) {
    existingImage?.remove()
    fallback.style.display = "inline-flex"
    setMarkerImageLoadingState({ shimmer, loading: false })
    return
  }

  if (cachedState === "failed") {
    existingImage?.remove()
    fallback.style.display = "inline-flex"
    setMarkerImageLoadingState({ shimmer, loading: false })
    return
  }

  if (existingImage && existingImage.dataset.src === imageSource) {
    if (cachedState === "loaded" || (existingImage.complete && existingImage.naturalWidth > 0)) {
      markMarkerImageLoaded(imageSource)
      existingImage.style.display = "block"
      fallback.style.display = "none"
      setMarkerImageLoadingState({ shimmer, loading: false })
      return
    }
    fallback.style.display = "inline-flex"
    setMarkerImageLoadingState({ shimmer, loading: true })
    return
  }

  existingImage?.remove()
  fallback.style.display = "inline-flex"
  setMarkerImageLoadingState({ shimmer, loading: cachedState !== "loaded" })

  const image = document.createElement("img")
  image.dataset.markerPart = "image"
  image.dataset.src = imageSource
  image.alt = ""
  image.loading = "eager"
  image.decoding = "async"
  image.style.width = "100%"
  image.style.height = "100%"
  image.style.objectFit = "cover"
  image.style.position = "relative"
  image.style.zIndex = "1"
  image.style.display = "none"
  image.addEventListener("load", () => {
    markMarkerImageLoaded(imageSource)
    image.style.display = "block"
    fallback.style.display = "none"
    setMarkerImageLoadingState({ shimmer, loading: false })
  })
  image.addEventListener("error", () => {
    markMarkerImageFailed(imageSource)
    image.remove()
    fallback.style.display = "inline-flex"
    setMarkerImageLoadingState({ shimmer, loading: false })
  })
  image.src = imageSource
  avatar.insertBefore(image, fallback)

  if (cachedState === "loaded" || (image.complete && image.naturalWidth > 0)) {
    markMarkerImageLoaded(imageSource)
    image.style.display = "block"
    fallback.style.display = "none"
    setMarkerImageLoadingState({ shimmer, loading: false })
  }
}
