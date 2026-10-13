"use client"

import type { RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  useResolveInitialPublicMapViewport,
  useSyncSidebarCameraPadding,
} from "./public-map-index-runtime"

export function usePublicMapCameraLifecycle({
  drawerInsetBottom,
  hasResolvedInitialViewportRef,
  initialOrganization,
  initialViewportResolved,
  mapLoadedRef,
  mapLoadVersion,
  mapRef,
  preferNationalFallback,
  setInitialViewportResolved,
  sidebarInsetLeft,
}: {
  drawerInsetBottom: number
  hasResolvedInitialViewportRef: RefObject<boolean>
  initialOrganization: PublicMapOrganization | null
  initialViewportResolved: boolean
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  mapRef: RefObject<mapboxgl.Map | null>
  preferNationalFallback: boolean
  setInitialViewportResolved: (resolved: boolean) => void
  sidebarInsetLeft: number
}) {
  useResolveInitialPublicMapViewport({
    hasResolvedInitialViewportRef,
    initialOrganization,
    mapLoadedRef,
    mapLoadVersion,
    mapRef,
    preferNationalFallback,
    setInitialViewportResolved,
  })
  useSyncSidebarCameraPadding({
    drawerInsetBottom,
    initialViewportResolved,
    mapLoadedRef,
    mapLoadVersion,
    mapRef,
    sidebarInsetLeft,
  })
}
