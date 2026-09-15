"use client"

import { useMemo, useState } from "react"
import type { FindMapWeatherResponse } from "@/features/find-map/client"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import {
  hasPublicMapCoolingIntent,
  resolvePublicMapResourcePresentation,
} from "@/lib/public-map/resource-seasonal-presentation"

import { usePublicMapSavedItems } from "./public-map-index-state"

export function usePublicMapSeasonalResources(
  sourceItems: ExternalResourceMapItem[],
  intent: Parameters<typeof hasPublicMapCoolingIntent>[0]
) {
  const [weather, setWeather] = useState<FindMapWeatherResponse | null>(null)
  const showCoolingCenters =
    weather?.signal === "official_alert" ||
    weather?.signal === "forecast_threshold" ||
    hasPublicMapCoolingIntent(intent)
  const resourceItems = useMemo(
    () =>
      sourceItems.flatMap((item) => {
        const presentation = resolvePublicMapResourcePresentation(
          item,
          showCoolingCenters
        )
        return presentation ? [presentation] : []
      }),
    [sourceItems, showCoolingCenters]
  )

  return { resourceItems, showCoolingCenters, weather, setWeather }
}

export function usePublicMapSeasonalSavedItems(
  input: Parameters<typeof usePublicMapSavedItems>[0],
  showCoolingCenters: boolean
) {
  const saved = usePublicMapSavedItems(input)
  const savedResources = useMemo(
    () => saved.savedResources.map(item =>
      resolvePublicMapResourcePresentation(item, showCoolingCenters) ?? item
    ),
    [saved.savedResources, showCoolingCenters]
  )
  return { ...saved, savedResources }
}
