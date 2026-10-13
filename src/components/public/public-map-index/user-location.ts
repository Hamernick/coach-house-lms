import type mapboxgl from "mapbox-gl"

export type UserLocationStatus = "idle" | "requesting" | "centered" | "denied" | "unavailable" | "error"
export type UserLocationFeedback = { tone: "default" | "error"; message: string } | null

export function buildLocationFeedback(status: UserLocationStatus): UserLocationFeedback {
  if (status === "requesting") {
    return { tone: "default", message: "Locating you…" }
  }
  if (status === "centered") {
    return { tone: "default", message: "Centered on your current location." }
  }
  if (status === "denied") {
    return { tone: "error", message: "Location access denied. Allow location access in your browser." }
  }
  if (status === "unavailable") {
    return { tone: "error", message: "Location is unavailable on this device/browser." }
  }
  if (status === "error") {
    return { tone: "error", message: "Could not read your location. Try again." }
  }
  return null
}

export function requestMapUserLocation({
  geolocateControl,
  setUserLocationStatus,
}: {
  geolocateControl: mapboxgl.GeolocateControl | null
  setUserLocationStatus: (status: UserLocationStatus) => void
}) {
  if (typeof window !== "undefined" && !("geolocation" in window.navigator)) {
    setUserLocationStatus("unavailable")
    return
  }
  if (!geolocateControl) {
    setUserLocationStatus("unavailable")
    return
  }
  setUserLocationStatus("requesting")
  try {
    const started = geolocateControl.trigger()
    if (!started) {
      setUserLocationStatus("unavailable")
    }
  } catch (error) {
    console.error("Geolocation trigger error:", error)
    setUserLocationStatus("error")
  }
}
