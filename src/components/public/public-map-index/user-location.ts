export type UserLocationStatus =
  | "idle"
  | "checking"
  | "prompt"
  | "requesting"
  | "centered"
  | "denied"
  | "unavailable"
  | "timed_out"
  | "error"

export type UserLocationFeedback = {
  tone: "default" | "error"
  message: string
} | null

export type PublicMapUserCoordinates = {
  latitude: number
  longitude: number
}

export type PublicMapLocationPermissionAction = "request" | "prompt" | "denied"

export const PUBLIC_MAP_LOCATION_ENTRANCE_SESSION_KEY =
  "public-map:location-entrance:v1"
export const PUBLIC_MAP_LOCATION_GRANTED_SESSION_KEY =
  "public-map:location-granted:v1"

export const PUBLIC_MAP_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 300_000,
}

export function buildLocationFeedback(
  status: UserLocationStatus
): UserLocationFeedback {
  if (status === "checking" || status === "requesting") {
    return { tone: "default", message: "Finding your location…" }
  }
  if (status === "denied") {
    return {
      tone: "error",
      message:
        "Location is blocked. Allow it in your browser settings, then try again.",
    }
  }
  if (status === "unavailable") {
    return {
      tone: "error",
      message:
        "Your device could not provide a location. Check Location Services, then try again.",
    }
  }
  if (status === "timed_out") {
    return {
      tone: "error",
      message:
        "The location request timed out. Check Location Services, then try again.",
    }
  }
  if (status === "error") {
    return {
      tone: "error",
      message: "We couldn’t find your location. Try again.",
    }
  }
  return null
}

export function resolveUserLocationStatusFromError(
  error: Pick<GeolocationPositionError, "code">
): UserLocationStatus {
  if (error.code === 1) return "denied"
  if (error.code === 2) return "unavailable"
  if (error.code === 3) return "timed_out"
  return "error"
}

export function resolvePublicMapLocationPermissionAction(
  permissionState: PermissionState
): PublicMapLocationPermissionAction {
  if (permissionState === "granted") return "request"
  if (permissionState === "denied") return "denied"
  return "prompt"
}

export function normalizePublicMapUserCoordinates({
  latitude,
  longitude,
}: PublicMapUserCoordinates): PublicMapUserCoordinates | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90) return null
  if (longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

export function hasRunPublicMapLocationEntrance(
  storage: Pick<Storage, "getItem">
) {
  try {
    return storage.getItem(PUBLIC_MAP_LOCATION_ENTRANCE_SESSION_KEY) === "1"
  } catch {
    return false
  }
}

export function markPublicMapLocationEntranceRun(
  storage: Pick<Storage, "setItem">
) {
  try {
    storage.setItem(PUBLIC_MAP_LOCATION_ENTRANCE_SESSION_KEY, "1")
  } catch {
    // A blocked session store must not block the location control.
  }
}

export function hasGrantedPublicMapLocation(storage: Pick<Storage, "getItem">) {
  try {
    return storage.getItem(PUBLIC_MAP_LOCATION_GRANTED_SESSION_KEY) === "1"
  } catch {
    return false
  }
}

export function markPublicMapLocationGranted(
  storage: Pick<Storage, "setItem">
) {
  try {
    storage.setItem(PUBLIC_MAP_LOCATION_GRANTED_SESSION_KEY, "1")
  } catch {
    // A blocked session store must not block the location control.
  }
}
