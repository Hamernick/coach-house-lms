"use client"

import { useEffect } from "react"

import {
  useFindMapWeather,
  type FindMapWeatherResponse,
} from "@/features/find-map/client"

export function PublicMapWeatherController({
  coordinates,
  onWeatherChange,
}: {
  coordinates: { latitude: number; longitude: number } | null
  onWeatherChange: (weather: FindMapWeatherResponse | null) => void
}) {
  const weather = useFindMapWeather(coordinates)

  useEffect(() => {
    onWeatherChange(weather)
  }, [onWeatherChange, weather])

  return null
}
