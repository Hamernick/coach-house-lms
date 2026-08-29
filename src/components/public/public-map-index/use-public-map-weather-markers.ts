"use client"

import type { RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-same-location"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"
import type { PublicMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { useFindMapWeather } from "../../../features/find-map/use-find-map-weather"

import { usePublicMapMarkers } from "./use-public-map-markers"

export function usePublicMapWeatherMarkers({
  activeSameLocationGroupKey,
  favorites,
  mapItems,
  mapLoadedRef,
  mapLoadVersion,
  mapRef,
  markerTheme,
  onOpenSameLocationGroup,
  onSelectOrganization,
  organizations,
  selectedOrganizationId,
  userCoordinates,
}: {
  activeSameLocationGroupKey: string | null
  favorites: string[]
  mapItems: PublicMapItem[]
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  mapRef: RefObject<mapboxgl.Map | null>
  markerTheme: PublicMapTheme
  onOpenSameLocationGroup: (group: PublicMapSameLocationSelection) => void
  onSelectOrganization: (organizationId: string) => void
  organizations: PublicMapOrganization[]
  selectedOrganizationId: string | null
  userCoordinates: { latitude: number; longitude: number } | null
}) {
  const weather = useFindMapWeather(userCoordinates)
  usePublicMapMarkers({
    activeSameLocationGroupKey,
    boostCoolingCenters:
      weather?.signal === "official_alert" ||
      weather?.signal === "forecast_threshold",
    favorites,
    mapItems,
    mapLoadedRef,
    mapLoadVersion,
    mapRef,
    markerTheme,
    onOpenSameLocationGroup,
    onSelectOrganization,
    organizations,
    selectedOrganizationId,
    userCoordinates,
  })
  return weather
}
