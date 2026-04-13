"use client"

import type { RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { buildMarkerInitials } from "./marker-avatar-content"
import { executeClusterSelection } from "./cluster-click-handlers"

const PUBLIC_MAP_MARKER_OVERLAY_SOURCE =
  "src/components/public/public-map-index/public-map-marker-overlay-buttons.tsx"
const PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT = "PublicMapOrganizationMarker"
const PUBLIC_MAP_CLUSTER_REACT_GRAB_COMPONENT = "PublicMapClusterMarker"
const PUBLIC_MAP_SHARED_LOCATION_REACT_GRAB_COMPONENT = "PublicMapSameLocationMarker"

function buildReactGrabProps({
  ownerId,
  component,
  slot,
}: {
  ownerId: string
  component: string
  slot: string
}) {
  if (process.env.NODE_ENV === "production") return {}

  return getReactGrabOwnerProps({
    ownerId,
    component,
    source: PUBLIC_MAP_MARKER_OVERLAY_SOURCE,
    slot,
  })
}

function resolveClusterMarkerSize(pointCount: number) {
  if (pointCount >= 100) return 48
  if (pointCount >= 20) return 42
  if (pointCount >= 5) return 38
  return 34
}

export function PublicMapOrganizationMarkerButton({
  organization,
  selected,
  projectedX,
  projectedY,
  onSelect,
}: {
  organization: PublicMapOrganization
  selected: boolean
  projectedX: number
  projectedY: number
  onSelect: () => void
}) {
  const imageUrl = organization.logoUrl?.trim() || organization.headerUrl?.trim() || undefined
  const avatarSize = selected ? 31 : 25

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`Open ${organization.name}`}
      title={organization.name}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="pointer-events-auto absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-transparent p-0 hover:bg-transparent hover:text-inherit focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        left: `${projectedX}px`,
        top: `${projectedY}px`,
        zIndex: selected ? 34 : 28,
      }}
      {...buildReactGrabProps({
        ownerId: `public-map-marker:${organization.id}`,
        component: PUBLIC_MAP_MARKER_REACT_GRAB_COMPONENT,
        slot: "marker",
      })}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-150 ease-out",
          selected
            ? "bg-white/60 p-[3px] shadow-[0_12px_26px_-14px_rgba(15,23,42,0.65)]"
            : "p-0 shadow-[0_8px_16px_-14px_rgba(15,23,42,0.4)]",
        )}
      >
        <Avatar
          className="overflow-hidden rounded-full border border-white/90 bg-white"
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            boxShadow: selected
              ? "0 0 0 1px rgba(255,255,255,0.92), 0 4px 14px rgba(15,23,42,0.2)"
              : "0 0 0 1px rgba(255,255,255,0.84), 0 3px 10px rgba(15,23,42,0.16)",
          }}
        >
          <AvatarImage src={imageUrl} alt="" className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-700">
            {buildMarkerInitials(organization.name)}
          </AvatarFallback>
        </Avatar>
      </span>
    </Button>
  )
}

export function PublicMapClusterMarkerButton({
  clusterId,
  pointCount,
  coordinates,
  projectedX,
  projectedY,
  mapRef,
  mapLoadedRef,
}: {
  clusterId: number
  pointCount: number
  coordinates: [number, number]
  projectedX: number
  projectedY: number
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
}) {
  const markerSize = resolveClusterMarkerSize(pointCount)

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`Zoom into ${pointCount.toLocaleString()} organizations`}
      title={`${pointCount.toLocaleString()} organizations`}
      onClick={(event) => {
        event.stopPropagation()
        executeClusterSelection({
          clusterId,
          coordinates,
          mapRef,
          mapLoadedRef,
        })
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-white/95 p-0 text-[12px] font-semibold text-slate-900 shadow-[0_10px_22px_-16px_rgba(15,23,42,0.7)] transition-transform duration-150 ease-out hover:scale-[1.03] hover:bg-white/95 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        left: `${projectedX}px`,
        top: `${projectedY}px`,
        width: `${markerSize}px`,
        height: `${markerSize}px`,
        zIndex: 18,
      }}
      {...buildReactGrabProps({
        ownerId: `public-map-cluster-marker:${clusterId}`,
        component: PUBLIC_MAP_CLUSTER_REACT_GRAB_COMPONENT,
        slot: "cluster-marker",
      })}
    >
      <span className="tabular-nums">{pointCount.toLocaleString()}</span>
    </Button>
  )
}

export function PublicMapSameLocationMarkerButton({
  organizations,
  locationLabel,
  projectedX,
  projectedY,
  selected,
  onOpenGroup,
  groupKey,
}: {
  organizations: PublicMapOrganization[]
  locationLabel: string | null
  projectedX: number
  projectedY: number
  selected: boolean
  onOpenGroup: () => void
  groupKey: string
}) {
  const leadOrganization = organizations[0]!
  const imageUrl =
    leadOrganization.logoUrl?.trim() || leadOrganization.headerUrl?.trim() || undefined
  const count = organizations.length
  const avatarSize = selected ? 31 : 27

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`Open ${count.toLocaleString()} organizations at this location`}
      title={locationLabel ? `${count.toLocaleString()} organizations at ${locationLabel}` : `${count.toLocaleString()} organizations here`}
      onClick={(event) => {
        event.stopPropagation()
        onOpenGroup()
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="pointer-events-auto absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-transparent p-0 hover:bg-transparent hover:text-inherit focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        left: `${projectedX}px`,
        top: `${projectedY}px`,
        zIndex: selected ? 32 : 24,
      }}
      {...buildReactGrabProps({
        ownerId: `public-map-same-location-marker:${groupKey}`,
        component: PUBLIC_MAP_SHARED_LOCATION_REACT_GRAB_COMPONENT,
        slot: "shared-location-marker",
      })}
    >
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-150 ease-out",
          selected
            ? "bg-white/60 p-[3px] shadow-[0_12px_26px_-14px_rgba(15,23,42,0.65)]"
            : "shadow-[0_10px_20px_-16px_rgba(15,23,42,0.52)]",
        )}
      >
        <Avatar
          className="overflow-hidden rounded-full border border-white/90 bg-white"
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.84), 0 3px 10px rgba(15,23,42,0.16)",
          }}
        >
          <AvatarImage src={imageUrl} alt="" className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-700">
            {buildMarkerInitials(leadOrganization.name)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex min-w-[19px] items-center justify-center rounded-full border border-white bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
          {count.toLocaleString()}
        </span>
      </span>
    </Button>
  )
}
