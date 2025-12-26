import { getMapboxToken } from "@/lib/mapbox/token"

const MAPBOX_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places"

export type GeocodeResult = {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const token = getMapboxToken()
  if (!token) return null
  const query = address.trim()
  if (!query) return null

  const url = `${MAPBOX_GEOCODE_ENDPOINT}/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      features?: Array<{ center?: [number, number] }>
    }
    const coords = data.features?.[0]?.center
    if (!coords || coords.length < 2) return null
    const [lng, lat] = coords
    if (typeof lat !== "number" || typeof lng !== "number") return null
    return { lat, lng }
  } catch {
    return null
  }
}
