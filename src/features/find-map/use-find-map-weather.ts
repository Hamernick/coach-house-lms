"use client"

import { useEffect, useState } from "react"

import {
  buildFindMapWeatherCell,
  parseFindMapWeatherResponse,
} from "@/lib/public-map/find-weather-contract"
import type { FindMapWeatherResponse } from "./types"

const CLIENT_CACHE_MS = 2 * 60 * 1000
const CLIENT_REQUEST_TIMEOUT_MS = 12 * 1000
const RETRY_BASE_MS = 15 * 1000
const RETRY_MAX_MS = 2 * 60 * 1000
export const FIND_MAP_WEATHER_REFRESH_MS = 10 * 60 * 1000

const responseCache = new Map<
  string,
  { expiresAt: number; response: FindMapWeatherResponse }
>()
const pendingRequests = new Map<
  string,
  Promise<FindMapWeatherResponse | null>
>()

export function resolveFindMapWeatherRetryDelay(failureCount: number) {
  const boundedFailureCount = Math.max(1, Math.floor(failureCount))
  return Math.min(RETRY_BASE_MS * 2 ** (boundedFailureCount - 1), RETRY_MAX_MS)
}

async function requestFindMapWeather(latitude: number, longitude: number) {
  const cell = buildFindMapWeatherCell({ latitude, longitude })
  if (!cell) return null
  const key = `${cell.latitude.toFixed(2)},${cell.longitude.toFixed(2)}`
  const cached = responseCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.response
  const pending = pendingRequests.get(key)
  if (pending) return pending

  const request = (async () => {
    const controller = new AbortController()
    const timeout = window.setTimeout(
      () => controller.abort(),
      CLIENT_REQUEST_TIMEOUT_MS
    )
    try {
      const response = await fetch("/api/public/find/weather", {
        body: JSON.stringify(cell),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      })
      if (!response.ok) return null
      const weather = parseFindMapWeatherResponse(await response.json())
      if (!weather) return null
      responseCache.set(key, {
        expiresAt: Date.now() + CLIENT_CACHE_MS,
        response: weather,
      })
      if (responseCache.size > 50) {
        responseCache.delete(responseCache.keys().next().value ?? key)
      }
      return weather
    } catch {
      return null
    } finally {
      window.clearTimeout(timeout)
    }
  })().finally(() => pendingRequests.delete(key))

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
    let failureCount = 0
    let loading = false
    let refreshTimer: number | null = null

    const clearRefreshTimer = () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = null
    }
    const scheduleRefresh = (delay: number) => {
      clearRefreshTimer()
      if (!active) return
      refreshTimer = window.setTimeout(() => void loadWeather(), delay)
    }
    const loadWeather = async () => {
      if (loading || latitude === undefined || longitude === undefined) {
        return
      }
      if (document.visibilityState === "hidden") {
        scheduleRefresh(FIND_MAP_WEATHER_REFRESH_MS)
        return
      }
      loading = true
      const response = await requestFindMapWeather(latitude, longitude)
      loading = false
      if (!active) return
      if (response) {
        failureCount = 0
        setWeather(response)
        scheduleRefresh(FIND_MAP_WEATHER_REFRESH_MS)
        return
      }
      failureCount += 1
      scheduleRefresh(resolveFindMapWeatherRetryDelay(failureCount))
    }
    const refreshWhenAvailable = () => {
      if (document.visibilityState !== "visible") return
      clearRefreshTimer()
      void loadWeather()
    }

    if (latitude === undefined || longitude === undefined) {
      setWeather(null)
      return () => {
        active = false
      }
    }

    setWeather(null)
    document.addEventListener("visibilitychange", refreshWhenAvailable)
    window.addEventListener("online", refreshWhenAvailable)
    void loadWeather()

    return () => {
      active = false
      clearRefreshTimer()
      document.removeEventListener("visibilitychange", refreshWhenAvailable)
      window.removeEventListener("online", refreshWhenAvailable)
    }
  }, [latitude, longitude])

  return weather
}
