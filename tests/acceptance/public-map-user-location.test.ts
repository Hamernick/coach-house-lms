import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  hasGrantedPublicMapLocation,
  hasRunPublicMapLocationEntrance,
  markPublicMapLocationGranted,
  markPublicMapLocationEntranceRun,
  normalizePublicMapUserCoordinates,
  PUBLIC_MAP_GEOLOCATION_OPTIONS,
  PUBLIC_MAP_LOCATION_ENTRANCE_SESSION_KEY,
  PUBLIC_MAP_LOCATION_GRANTED_SESSION_KEY,
  resolvePublicMapLocationPermissionAction,
  resolveUserLocationStatusFromError,
} from "@/components/public/public-map-index/user-location"
import { FALLBACK_ZOOM } from "@/components/public/public-map-index/map-view-helpers"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public map user location", () => {
  it("maps browser permission states without prompting automatically", () => {
    expect(resolvePublicMapLocationPermissionAction("granted")).toBe("request")
    expect(resolvePublicMapLocationPermissionAction("prompt")).toBe("prompt")
    expect(resolvePublicMapLocationPermissionAction("denied")).toBe("denied")
  })

  it("uses one low-accuracy location request with bounded caching", () => {
    expect(PUBLIC_MAP_GEOLOCATION_OPTIONS).toEqual({
      enableHighAccuracy: false,
      timeout: 7_000,
      maximumAge: 300_000,
    })
    expect(resolveUserLocationStatusFromError({ code: 1 })).toBe("denied")
    expect(resolveUserLocationStatusFromError({ code: 2 })).toBe("unavailable")
    expect(resolveUserLocationStatusFromError({ code: 3 })).toBe("error")
  })

  it("rejects invalid coordinates", () => {
    expect(
      normalizePublicMapUserCoordinates({ latitude: 41.88, longitude: -87.63 })
    ).toEqual({ latitude: 41.88, longitude: -87.63 })
    expect(
      normalizePublicMapUserCoordinates({ latitude: 91, longitude: -87.63 })
    ).toBeNull()
    expect(
      normalizePublicMapUserCoordinates({
        latitude: 41.88,
        longitude: Infinity,
      })
    ).toBeNull()
  })

  it("gates the entrance in tab-scoped session storage", () => {
    const entries = new Map<string, string>()
    const storage = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    }

    expect(hasRunPublicMapLocationEntrance(storage)).toBe(false)
    markPublicMapLocationEntranceRun(storage)
    expect(entries.get(PUBLIC_MAP_LOCATION_ENTRANCE_SESSION_KEY)).toBe("1")
    expect(hasRunPublicMapLocationEntrance(storage)).toBe(true)
    expect(hasGrantedPublicMapLocation(storage)).toBe(false)
    markPublicMapLocationGranted(storage)
    expect(entries.get(PUBLIC_MAP_LOCATION_GRANTED_SESSION_KEY)).toBe("1")
    expect(hasGrantedPublicMapLocation(storage)).toBe(true)
  })

  it("keeps location client-only and the entrance non-essential", () => {
    const hookSource = readSource(
      "src/components/public/public-map-index/use-public-map-user-location.ts"
    )
    const runtimeSource = readSource(
      "src/components/public/public-map-index/public-map-index-runtime.ts"
    )

    expect(hookSource).toContain("window.sessionStorage")
    expect(hookSource).toContain('.query({ name: "geolocation" })')
    expect(hookSource).toContain('requestPosition("entrance")')
    expect(hookSource).toContain("setControlOpen(!storedGrant)")
    expect(hookSource).toContain("essential: false")
    expect(hookSource).not.toContain("localStorage")
    expect(hookSource).not.toContain("fetch(")
    expect(runtimeSource).not.toContain("getCurrentPosition")
  })

  it("keeps the location indicator unchanged under night lighting", () => {
    const hookSource = readSource(
      "src/components/public/public-map-index/use-public-map-user-location.ts"
    )

    expect(hookSource.match(/"circle-emissive-strength": 1/g)).toHaveLength(2)
  })

  it("opens a centered prompt over a slowly rotating wider globe", () => {
    const hookSource = readSource(
      "src/components/public/public-map-index/use-public-map-user-location.ts"
    )
    const locationControlSource = readSource(
      "src/components/public/public-map-index/location-control.tsx"
    )
    const sidebarThemeSource = readSource(
      "src/components/public/public-map-index/sidebar-theme.ts"
    )

    expect(FALLBACK_ZOOM).toBe(1.5)
    expect(hookSource).toContain("!suppressAutomaticEntrance && !welcomeOpen")
    expect(hookSource).toContain("setControlOpen(!storedGrant)")
    expect(hookSource).toContain(
      "PUBLIC_MAP_GLOBE_SECONDS_PER_REVOLUTION = 180"
    )
    expect(hookSource).toContain(
      'window.matchMedia("(prefers-reduced-motion: reduce)").matches'
    )
    expect(hookSource).toContain('map.on("moveend", spinGlobe)')
    expect(hookSource).toContain("if (!event.originalEvent) return")
    expect(locationControlSource).toContain(
      "absolute inset-0 flex items-center justify-center p-4"
    )
    expect(sidebarThemeSource).toContain(
      "bg-background/88 text-foreground backdrop-blur-xl"
    )
    expect(sidebarThemeSource).toContain("dark:border-input dark:bg-input/35")
    expect(sidebarThemeSource).not.toContain('"dark border-input')
    expect(locationControlSource).toContain(
      "PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME"
    )
    expect(locationControlSource).not.toContain("bg-card/92")
    expect(locationControlSource).not.toContain("bg-background/92")
    expect(locationControlSource).not.toContain("dark:bg-input/30")
    expect(locationControlSource).not.toContain("bg-background/95")
    expect(locationControlSource).not.toContain("absolute top-10 left-0")
  })

  it("focuses a granted location at neighborhood scale", () => {
    const hookSource = readSource(
      "src/components/public/public-map-index/use-public-map-user-location.ts"
    )

    expect(hookSource).toContain("PUBLIC_MAP_USER_LOCATION_ZOOM = 13")
    expect(hookSource).toContain(
      "zoom: Math.max(map.getZoom(), PUBLIC_MAP_USER_LOCATION_ZOOM)"
    )
    expect(hookSource).toMatch(
      /const storedGrant = hasGrantedPublicMapLocation\(window\.sessionStorage\)[\s\S]*\.query\(\{ name: "geolocation" \}\)[\s\S]*requestPosition\("entrance"\)/
    )
  })

  it("keeps a fast location result until the deferred map is ready", () => {
    const indexSource = readSource("src/components/public/public-map-index.tsx")
    const runtimeSource = readSource(
      "src/components/public/public-map-index/public-map-index-runtime.ts"
    )
    const hookSource = readSource(
      "src/components/public/public-map-index/use-public-map-user-location.ts"
    )

    expect(indexSource).toContain("mapStartRef")
    expect(indexSource).toContain(
      "onRequestMapStart: () => mapStartRef.current?.()"
    )
    expect(runtimeSource).toContain("mapStartRef.current = startMap")
    expect(hookSource).toContain("shouldFocusLocationRef")
    expect(hookSource).toMatch(
      /shouldFocusLocationRef\.current =\s*source === "manual"[\s\S]*setCoordinates\(nextCoordinates\)[\s\S]*setStatus\("centered"\)/
    )
    expect(hookSource).toMatch(
      /const handleConfirm = useCallback\(\(\) => \{\s*onRequestMapStart\(\)\s*requestPosition\("manual"\)/
    )
    expect(hookSource).not.toMatch(
      /const nextCoordinates[\s\S]*?const map = mapRef\.current[\s\S]*?if \(!map \|\| !mapLoadedRef\.current\) return/
    )
  })

  it("renders the control at map top-left and Welcome at top-center", () => {
    const locationControlSource = readSource(
      "src/components/public/public-map-index/location-control.tsx"
    )
    const welcomeControlSource = readSource(
      "src/components/public/public-map-index/member-onboarding-preview-controls.tsx"
    )
    const statusPillSource = readSource(
      "src/components/public/public-map-index/directory-status-pill.tsx"
    )

    expect(locationControlSource).toContain("safe-area-inset-top")
    expect(locationControlSource).toContain("safe-area-inset-left")
    expect(locationControlSource).toContain("PublicMapDirectoryStatusPill")
    expect(locationControlSource).toContain(
      "PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME"
    )
    expect(statusPillSource).toContain("PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME")
    expect(locationControlSource).toContain("size-8 rounded-full")
    expect(locationControlSource).toContain("Use your location?")
    expect(locationControlSource.replace(/\s+/g, " ")).toContain(
      "Your location is not saved"
    )
    expect(welcomeControlSource).toContain("left-1/2")
    expect(welcomeControlSource).toContain("-translate-x-1/2")
    expect(welcomeControlSource).toContain('"Welcome"')
    expect(welcomeControlSource).toContain('"Hide welcome"')
    expect(welcomeControlSource).toContain("PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME")
  })

  it("limits geolocation to same-origin find routes", () => {
    const configSource = readSource("next.config.ts")

    expect(configSource).toContain('source: "/find/:path*"')
    expect(configSource).toContain('key: "Permissions-Policy"')
    expect(configSource).toContain('value: "geolocation=(self)"')
  })
})
