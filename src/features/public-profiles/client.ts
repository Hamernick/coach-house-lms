"use client"

export {
  normalizePublicHandle,
  PUBLIC_HANDLE_MAX_LENGTH,
  PUBLIC_HANDLE_MIN_LENGTH,
  PUBLIC_HANDLE_PATTERN,
  RESERVED_PUBLIC_HANDLES,
  validatePublicHandle,
} from "./lib"
export { PublicProfileIdentitySettings } from "./components/public-profile-identity-settings"
export { PublicProfileAffiliationSettings } from "./components/public-profile-affiliation-settings"
export { PublicProfileSavedCollectionSettings } from "./components/public-profile-saved-collection-settings"
export { PublicProfileSettings } from "./components/public-profile-settings"
export { TrackedResourceShareButton } from "./components/tracked-resource-share-button"
export { usePublicHandleAvailability } from "./hooks/use-public-handle-availability"
export type { PublicHandleAvailabilityStatus } from "./hooks/use-public-handle-availability"
