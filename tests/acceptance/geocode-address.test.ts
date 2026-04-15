import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it("defaults to Nominatim without requiring a Mapbox token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ lat: "41.8781", lon: "-87.6298" }]),
    })

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://coachhouse.example")
    vi.stubGlobal("fetch", fetchMock)

    const { geocodeAddress } = await import("@/lib/geocoding/geocode")
    const result = await geocodeAddress("Chicago, IL")

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]!
    const parsed = new URL(String(url))

    expect(parsed.origin).toBe("https://nominatim.openstreetmap.org")
    expect(parsed.pathname).toBe("/search")
    expect(parsed.searchParams.get("q")).toBe("Chicago, IL")
    expect(parsed.searchParams.get("format")).toBe("jsonv2")
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: expect.objectContaining({
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "coach-house-platform/1 (coachhouse.example)",
      }),
    })
    expect(result).toEqual({ lat: 41.8781, lng: -87.6298 })
  })

  it("uses Mapbox only when explicitly configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        features: [{ center: [-87.6298, 41.8781] }],
      }),
    })

    vi.stubEnv("GEOCODER_PROVIDER", "mapbox")
    vi.stubEnv("MAPBOX_TOKEN", "test-mapbox-token")
    vi.stubGlobal("fetch", fetchMock)

    const { geocodeAddress } = await import("@/lib/geocoding/geocode")
    const result = await geocodeAddress("Chicago, IL")

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toContain("https://api.mapbox.com/geocoding/v5/mapbox.places/")
    expect(String(url)).toContain("access_token=test-mapbox-token")
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
    })
    expect(result).toEqual({ lat: 41.8781, lng: -87.6298 })
  })
})
