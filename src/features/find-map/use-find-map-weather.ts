"use client"

import { useEffect, useState } from "react"

import { buildFindMapWeatherCell } from "./lib/weather"
import type { FindMapWeatherResponse } from "./types"

const CLIENT_CACHE_MS = 2 * 60 * 1000
const responseCache = new Map<
  string,
  { expiresAt: number; response: FindMapWeatherResponse }
>()
const pendingRequests = new Map<
  string,
  Promise<FindMapWeatherResponse | null>
>()

async function requestFindMapWeather(latitude: number, longitude: number) {
  const cell = buildFindMapWeatherCell({ latitude, longitude })
  if (!cell) return null
  const key = `${cell.latitude.toFixed(2)},${cell.longitude.toFixed(2)}`
  const cached = responseCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.response
  const pending = pendingRequests.get(key)
  if (pending) return pending

  const request = fetch("/api/public/find/weather", {
    body: JSON.stringify(cell),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
    .then(async (response) => {
      if (!response.ok) return null
      const weather = (await response.json()) as FindMapWeatherResponse
      responseCache.set(key, {
        expiresAt: Date.now() + CLIENT_CACHE_MS,
        response: weather,
      })
      if (responseCache.size > 50) {
        responseCache.delete(responseCache.keys().next().value ?? key)
      }
      return weather
    })
    .catch(() => null)
    .finally(() => pendingRequests.delete(key))
  pendingRequests.set(key, request)
  return request
}

export function useFindMapWeather(
  coordinates: { latitude: number; longitude: number } | null
) {
  const [weather, setWeather] = useState<FindMapWeatherResponse | null>(null)
  const latitude = coordinates?.latitude
  const longitude = coordinates?.longitude

  useEffect(() => {
    let active = true
    if (latitude === undefined || longitude === undefined) {
      setWeather(null)
      return () => {
        active = false
      }
    }

    void requestFindMapWeather(latitude, longitude).then((response) => {
      if (active) setWeather(response)
    })
    return () => {
      active = false
    }
  }, [latitude, longitude])

  return weather
}
