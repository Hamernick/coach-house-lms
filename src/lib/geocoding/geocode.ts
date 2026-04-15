import "server-only"

import { env } from "@/lib/env"

const MAPBOX_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places"
const NOMINATIM_GEOCODE_BASE_URL = "https://nominatim.openstreetmap.org"

export type GeocodeProvider = "mapbox" | "nominatim"

export type GeocodeResult = {
  lat: number
  lng: number
}

function resolveGeocodeProvider(): GeocodeProvider {
  const configured = env.GEOCODER_PROVIDER?.trim().toLowerCase()
  if (configured === "mapbox") return "mapbox"
  return "nominatim"
}

function resolveMapboxToken() {
  return (env.MAPBOX_TOKEN ?? env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
}

function resolveNominatimSearchUrl(query: string) {
  const base = new URL(env.GEOCODER_BASE_URL ?? NOMINATIM_GEOCODE_BASE_URL)
  base.pathname = `${base.pathname.replace(/\/$/, "")}/search`
  base.searchParams.set("q", query)
  base.searchParams.set("format", "jsonv2")
  base.searchParams.set("limit", "1")
  base.searchParams.set("addressdetails", "1")

  if (env.GEOCODER_CONTACT_EMAIL) {
    base.searchParams.set("email", env.GEOCODER_CONTACT_EMAIL)
  }

  return base
}

function resolveNominatimUserAgent() {
  const configured = env.GEOCODER_USER_AGENT?.trim()
  if (configured) return configured

  const candidateSiteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim()
  if (candidateSiteUrl) {
    try {
      const hostname = new URL(candidateSiteUrl).hostname
      return `coach-house-platform/1 (${hostname})`
    } catch {
      return `coach-house-platform/1 (${candidateSiteUrl})`
    }
  }

  return "coach-house-platform/1"
}

async function geocodeWithMapbox(query: string): Promise<GeocodeResult | null> {
  const token = resolveMapboxToken()
  if (!token) {
    console.error("[geocode] Mapbox provider configured without a token.")
    return null
  }

  const url = `${MAPBOX_GEOCODE_ENDPOINT}/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })
    if (!response.ok) {
      console.error("[geocode] Mapbox request failed.", { status: response.status })
      return null
    }

    const data = (await response.json()) as {
      features?: Array<{ center?: [number, number] }>
    }
    const coords = data.features?.[0]?.center
    if (!coords || coords.length < 2) return null

    const [lng, lat] = coords
    if (typeof lat !== "number" || typeof lng !== "number") return null

    return { lat, lng }
  } catch (error) {
    console.error("[geocode] Mapbox request threw.", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  const url = resolveNominatimSearchUrl(query)

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": resolveNominatimUserAgent(),
      },
    })

    if (!response.ok) {
      console.error("[geocode] Nominatim request failed.", { status: response.status })
      return null
    }

    const data = (await response.json()) as Array<{
      lat?: string
      lon?: string
    }>
    const first = data[0]
    if (!first) return null

    const lat = Number(first.lat)
    const lng = Number(first.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return { lat, lng }
  } catch (error) {
    console.error("[geocode] Nominatim request threw.", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim()
  if (!query) return null

  if (resolveGeocodeProvider() === "mapbox") {
    return geocodeWithMapbox(query)
  }

  return geocodeWithNominatim(query)
}
