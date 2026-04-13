"use client"

import { useEffect, useRef, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  syncClusterSourceAndLayers,
  syncSelectedOrganizationLayers,
} from "./map-layer-sync"

function useSyncPublicMapMarkerRefs({
  selectedOrganizationId,
  selectedOrganizationIdRef,
}: {
  selectedOrganizationId: string | null
  selectedOrganizationIdRef: RefObject<string | null>
}) {
  useEffect(() => {
    selectedOrganizationIdRef.current = selectedOrganizationId
  }, [selectedOrganizationId, selectedOrganizationIdRef])
}

function useSyncClusterSourceData({
  mapRef,
  mapLoadedRef,
  mapLoadVersion,
  organizations,
  selectedOrganizationIdRef,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  organizations: PublicMapOrganization[]
  selectedOrganizationIdRef: RefObject<string | null>
}) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const syncLayers = () => {
      if (!mapLoadedRef.current) return
      syncClusterSourceAndLayers({ map, organizations })
      syncSelectedOrganizationLayers({
        map,
        selectedOrganizationId: selectedOrganizationIdRef.current,
      })
    }

    syncLayers()
    map.on("style.load", syncLayers)
    return () => {
      map.off("style.load", syncLayers)
    }
  }, [mapLoadVersion, mapLoadedRef, mapRef, organizations, selectedOrganizationIdRef])
}

function useSyncSelectedOrganizationLayers({
  mapRef,
  mapLoadedRef,
  mapLoadVersion,
  selectedOrganizationId,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  selectedOrganizationId: string | null
}) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    syncSelectedOrganizationLayers({
      map,
      selectedOrganizationId,
    })
  }, [mapLoadVersion, mapLoadedRef, mapRef, selectedOrganizationId])
}

export function usePublicMapClusteredMarkers({
  mapRef,
  mapLoadedRef,
  organizations,
  mapLoadVersion,
  selectedOrganizationId,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  organizations: PublicMapOrganization[]
  mapLoadVersion: number
  selectedOrganizationId: string | null
}) {
  const selectedOrganizationIdRef = useRef<string | null>(selectedOrganizationId)

  useSyncPublicMapMarkerRefs({
    selectedOrganizationId,
    selectedOrganizationIdRef,
  })
  useSyncClusterSourceData({
    mapRef,
    mapLoadedRef,
    mapLoadVersion,
    organizations,
    selectedOrganizationIdRef,
  })
  useSyncSelectedOrganizationLayers({
    mapRef,
    mapLoadedRef,
    mapLoadVersion,
    selectedOrganizationId,
  })
}
