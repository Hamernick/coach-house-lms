import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { describe, expect, it } from "vitest"

import {
  FIND_MAP_FEATURE_NAME,
  FindMapLoadingSidebar,
  FindMapLoadingState,
  FindMapWeatherCard,
  buildFindMapWeatherCell,
  buildFindMapWeatherResponse,
  normalizeNwsHeatEvent,
  parseFindMapWeatherCell,
} from "@/features/find-map"
import { resolveNwsGridFreshness } from "@/features/find-map/server/weather"

const ROOT = process.cwd()

describe("find-map feature", () => {
  it("exposes a stable public feature entrypoint", () => {
    expect(FIND_MAP_FEATURE_NAME).toBe("find-map")
  })

  it("uses a layout-preserving initial state instead of generic skeletons", () => {
    const markup = renderToStaticMarkup(createElement(FindMapLoadingState))
    const sidebarMarkup = renderToStaticMarkup(
      createElement(FindMapLoadingSidebar)
    )
    const routeSource = readFileSync(
      join(ROOT, "src/app/(public)/find/loading.tsx"),
      "utf8"
    )
    const shellSource = readFileSync(
      join(ROOT, "src/components/public/home-canvas-find-shell.tsx"),
      "utf8"
    )

    expect(routeSource).toContain("<FindMapLoadingState />")
    expect(routeSource).toContain("<FindMapLoadingSidebar />")
    expect(routeSource).toContain("sidebarFallback={")
    expect(routeSource).toContain("showAuthActions={false}")
    expect(routeSource).toContain("function PublicFindLoading()")
    expect(routeSource).not.toContain("async function PublicFindLoading")
    expect(routeSource).not.toContain("fetchPublicMapViewerState")
    expect(routeSource).not.toContain("resolveDashboardLayoutState")
    expect(routeSource).not.toContain("Skeleton")
    expect(shellSource).toContain(
      '"--sidebar-width": sidebarFallback === null ? "23rem" : "15rem"'
    )
    expect(shellSource).toContain("hasSidebarSlot || sidebarFallback !== null")
    expect(sidebarMarkup).toContain('data-find-map-loading-sidebar=""')
    expect(sidebarMarkup).toContain('aria-hidden="true"')
    expect(markup).toContain('data-find-map-loading-state="layout-preserving"')
    expect(markup).toContain('data-find-map-loading-drawer=""')
    expect(markup).toContain("min-h-[336px]")
    expect(markup).toContain("rounded-t-[28px]")
    expect(markup).toContain("Find organizations and resources")
    expect(markup).toContain("Loading resources…")
    expect(markup).toContain('aria-busy="true"')
    expect(markup).toContain("motion-reduce:animate-none")
    expect(markup).not.toContain('data-slot="skeleton"')
    expect(markup.match(/animate-spin/g)).toHaveLength(1)
  })

  it("coarsens location before weather requests", () => {
    expect(
      buildFindMapWeatherCell({ latitude: 41.8781, longitude: -87.6298 })
    ).toEqual({ latitude: 41.9, longitude: -87.65 })
    expect(
      parseFindMapWeatherCell({ latitude: 41.9, longitude: -87.65 })
    ).toEqual({ latitude: 41.9, longitude: -87.65 })
    expect(
      parseFindMapWeatherCell({ latitude: 41.8781, longitude: -87.6298 })
    ).toBeNull()
  })

  it("normalizes current and legacy NWS heat events", () => {
    expect(normalizeNwsHeatEvent("Heat Advisory")).toBe("Heat Advisory")
    expect(normalizeNwsHeatEvent("Excessive Heat Warning")).toBe(
      "Extreme Heat Warning"
    )
    expect(normalizeNwsHeatEvent("Wind Advisory")).toBeNull()
  })

  it("accepts a current NWS forecast cycle without trusting an old grid", () => {
    const now = Date.parse("2026-08-28T17:30:00.000Z")

    expect(
      resolveNwsGridFreshness(
        { properties: { updateTime: "2026-08-28T08:20:00.000Z" } },
        now
      )
    ).toBe("fresh")
    expect(
      resolveNwsGridFreshness(
        { properties: { updateTime: "2026-08-28T05:00:00.000Z" } },
        now
      )
    ).toBe("stale")
  })

  it("builds compact weather data and detects two forecast heat hours", () => {
    const now = Date.parse("2026-08-27T12:00:00.000Z")
    const response = buildFindMapWeatherResponse({
      alerts: { features: [] },
      alertsAvailable: true,
      freshness: "fresh",
      now,
      point: {
        properties: {
          relativeLocation: {
            properties: { city: "Chicago", state: "IL" },
          },
          timeZone: "America/Chicago",
        },
      },
      grid: {
        properties: {
          updateTime: "2026-08-27T11:45:00.000Z",
          temperature: {
            values: [{ validTime: "2026-08-27T12:00:00Z/PT2H", value: 38 }],
          },
          heatIndex: {
            values: [{ validTime: "2026-08-27T12:00:00Z/PT2H", value: 38 }],
          },
          maxTemperature: {
            values: [{ validTime: "2026-08-27T06:00:00Z/PT18H", value: 39 }],
          },
          minTemperature: {
            values: [{ validTime: "2026-08-27T06:00:00Z/PT18H", value: 24 }],
          },
        },
      },
    })

    expect(response).toMatchObject({
      signal: "forecast_threshold",
      snapshot: {
        city: "Chicago",
        state: "IL",
        temperatureFahrenheit: 100,
        highFahrenheit: 102,
        lowFahrenheit: 75,
      },
    })
    const markup = renderToStaticMarkup(
      createElement(FindMapWeatherCard, { weather: response.snapshot })
    )
    expect(markup).toContain("100°")
    expect(markup).not.toContain("Chicago, IL")
    expect(markup).not.toContain("H 102° L 75°")
    expect(markup).toContain('aria-label="Current temperature: 100 degrees."')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('data-react-grab-anchor="FindMapWeatherCard"')
    expect(markup).toContain(
      'data-react-grab-owner-id="find-map-weather-card:current-location"'
    )
    expect(markup).toContain('data-react-grab-surface-slot="temperature"')
    expect(markup).toContain("pointer-events-auto")
    expect(markup).toContain("h-10")
    expect(markup).toContain("min-w-14")
    expect(markup).toContain("rounded-xl")
    expect(markup).toContain("first:pt-0")
  })

  it("does not use a stale forecast to boost cooling resources", () => {
    const now = Date.parse("2026-08-28T17:30:00.000Z")
    const response = buildFindMapWeatherResponse({
      alerts: { features: [] },
      alertsAvailable: true,
      freshness: "stale",
      now,
      point: {
        properties: {
          relativeLocation: {
            properties: { city: "Chicago", state: "IL" },
          },
          timeZone: "America/Chicago",
        },
      },
      grid: {
        properties: {
          updateTime: "2026-08-28T05:00:00.000Z",
          temperature: {
            values: [{ validTime: "2026-08-28T17:00:00Z/PT2H", value: 38 }],
          },
          heatIndex: {
            values: [{ validTime: "2026-08-28T17:00:00Z/PT2H", value: 38 }],
          },
          maxTemperature: {
            values: [{ validTime: "2026-08-28T06:00:00Z/PT18H", value: 39 }],
          },
          minTemperature: {
            values: [{ validTime: "2026-08-28T06:00:00Z/PT18H", value: 24 }],
          },
        },
      },
    })

    expect(response.signal).toBe("unknown")
    expect(response.snapshot?.freshness).toBe("stale")

    const markup = renderToStaticMarkup(
      createElement(FindMapWeatherCard, { weather: response.snapshot })
    )
    expect(markup).toContain("100°")
    expect(markup).not.toContain("Chicago, IL")
    expect(markup).not.toContain("H 102° L 75°")
    expect(markup).toContain('data-weather-freshness="stale"')
    expect(markup).toContain("Weather data may be delayed.")
    expect(markup).toContain("min-w-14")
  })
})
