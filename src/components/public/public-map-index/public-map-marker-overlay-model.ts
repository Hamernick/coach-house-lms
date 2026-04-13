import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { organizationHasMapLocation } from "./helpers"
import { resolveFeatureCoordinatesForMap } from "./map-coordinate-normalization"
import { PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID } from "./map-view-helpers"
import {
  coalesceClusterReconcileFeatures,
  queryVisibleUnclusteredOrganizationFeatures,
  resolveClusterId,
  resolveOrganizationId,
  resolvePointCount,
  type ClusteredMarkerEntry,
} from "./public-map-cluster-runtime"
import {
  type PublicMapSameLocationCapableOrganization,
  resolveSameLocationGroupKey,
  resolveSameLocationLabel,
} from "./same-location-groups"

const MARKER_VIEWPORT_PADDING = 44

type PublicMapOrganizationWithLocation = PublicMapOrganization & {
  latitude: number
  longitude: number
}

type VisibleOrganizationEntry = {
  organization: PublicMapOrganizationWithLocation
  coordinates: [number, number]
}

type VisibleSameLocationGroup = {
  key: string
  coordinates: [number, number]
  locationLabel: string | null
  organizations: PublicMapOrganizationWithLocation[]
}

export type PublicMapSameLocationSelection = {
  key: string
  organizationIds: string[]
  locationLabel: string | null
}

export type PublicMapMarkerOverlayItem =
  | {
      kind: "organization"
      key: string
      organization: PublicMapOrganization
      projectedX: number
      projectedY: number
      selected: boolean
    }
  | {
      kind: "cluster"
      key: string
      clusterId: number
      pointCount: number
      coordinates: [number, number]
      projectedX: number
      projectedY: number
    }
  | {
      kind: "same-location-group"
      key: string
      organizationIds: string[]
      organizations: PublicMapOrganization[]
      locationLabel: string | null
      projectedX: number
      projectedY: number
      selected: boolean
    }

function resolveOverlayItemZIndex(item: PublicMapMarkerOverlayItem) {
  if (item.kind === "organization") {
    return item.selected ? 34 : 28
  }
  if (item.kind === "same-location-group") {
    return item.selected ? 32 : 24
  }
  return 18
}

function isProjectedPointVisible({
  map,
  x,
  y,
}: {
  map: mapboxgl.Map
  x: number
  y: number
}) {
  const canvas = map.getCanvas()
  if (!canvas) return false

  return (
    x >= -MARKER_VIEWPORT_PADDING &&
    x <= canvas.clientWidth + MARKER_VIEWPORT_PADDING &&
    y >= -MARKER_VIEWPORT_PADDING &&
    y <= canvas.clientHeight + MARKER_VIEWPORT_PADDING
  )
}

export function shallowEqualOverlayItems(
  left: PublicMapMarkerOverlayItem[],
  right: PublicMapMarkerOverlayItem[],
) {
  if (left.length !== right.length) return false

  for (let index = 0; index < left.length; index += 1) {
    const current = left[index]
    const next = right[index]
    if (!current || !next) return false
    if (current.kind !== next.kind || current.key !== next.key) return false
    if (current.projectedX !== next.projectedX || current.projectedY !== next.projectedY) {
      return false
    }

    if (current.kind === "organization" && next.kind === "organization") {
      if (current.organization.id !== next.organization.id || current.selected !== next.selected) {
        return false
      }
      continue
    }

    if (current.kind === "cluster" && next.kind === "cluster") {
      if (current.clusterId !== next.clusterId || current.pointCount !== next.pointCount) {
        return false
      }
      continue
    }

    if (current.kind === "same-location-group" && next.kind === "same-location-group") {
      if (
        current.selected !== next.selected ||
        current.locationLabel !== next.locationLabel ||
        current.organizationIds.length !== next.organizationIds.length
      ) {
        return false
      }
      for (let groupIndex = 0; groupIndex < current.organizationIds.length; groupIndex += 1) {
        if (current.organizationIds[groupIndex] !== next.organizationIds[groupIndex]) {
          return false
        }
      }
      continue
    }

    return false
  }

  return true
}

function resolveVisibleClusterItems({
  map,
}: {
  map: mapboxgl.Map
}): PublicMapMarkerOverlayItem[] {
  const rawClusterFeatures = map.queryRenderedFeatures({
    layers: [PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID],
  })
  const coalescedClusterFeatures = coalesceClusterReconcileFeatures({
    map,
    features: rawClusterFeatures,
    markersByKey: new Map<string, ClusteredMarkerEntry>(),
  })

  return coalescedClusterFeatures.flatMap((feature) => {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const clusterId = resolveClusterId(properties.cluster_id)
    const pointCount = resolvePointCount(properties.point_count)
    const coordinates = resolveFeatureCoordinatesForMap({
      map,
      feature,
    })
    if (clusterId === null || pointCount < 2 || !coordinates) return []

    const projected = map.project(coordinates)
    if (
      !isProjectedPointVisible({
        map,
        x: projected.x,
        y: projected.y,
      })
    ) {
      return []
    }

    return [
      {
        kind: "cluster" as const,
        key: `cluster:${clusterId}`,
        clusterId,
        pointCount,
        coordinates,
        projectedX: Math.round(projected.x),
        projectedY: Math.round(projected.y),
      },
    ]
  })
}

function resolveVisibleOrganizationEntries({
  map,
  organizationById,
}: {
  map: mapboxgl.Map
  organizationById: Map<string, PublicMapOrganization>
}): VisibleOrganizationEntry[] {
  const visibleFeatures = queryVisibleUnclusteredOrganizationFeatures({
    map,
  })

  return visibleFeatures.flatMap((feature) => {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const organizationId = resolveOrganizationId(properties.organizationId)
    if (!organizationId) return []

    const organization = organizationById.get(organizationId)
    if (!organization || !organizationHasMapLocation(organization)) return []

    const coordinates =
      resolveFeatureCoordinatesForMap({
        map,
        feature,
      }) ?? [organization.longitude, organization.latitude]

    return [
      {
        organization,
        coordinates,
      },
    ]
  })
}

function resolveVisibleOrganizationAndGroupItems({
  map,
  organizationById,
  selectedOrganizationId,
  activeSameLocationGroupKey,
}: {
  map: mapboxgl.Map
  organizationById: Map<string, PublicMapOrganization>
  selectedOrganizationId: string | null
  activeSameLocationGroupKey: string | null
}) {
  const visibleEntries = resolveVisibleOrganizationEntries({
    map,
    organizationById,
  })
  const sameLocationGroupsByKey = new Map<string, VisibleSameLocationGroup>()

  for (const entry of visibleEntries) {
    const organization = {
      ...entry.organization,
      latitude: entry.organization.latitude,
      longitude: entry.organization.longitude,
    } satisfies PublicMapSameLocationCapableOrganization
    const groupKey = resolveSameLocationGroupKey({
      longitude: organization.longitude,
      latitude: organization.latitude,
    })
    const existingGroup = sameLocationGroupsByKey.get(groupKey)
    if (existingGroup) {
      existingGroup.organizations.push(entry.organization)
      continue
    }

    sameLocationGroupsByKey.set(groupKey, {
      key: groupKey,
      coordinates: entry.coordinates,
      locationLabel: resolveSameLocationLabel(organization),
      organizations: [entry.organization],
    })
  }

  const items: PublicMapMarkerOverlayItem[] = []

  for (const entry of visibleEntries) {
    const group = sameLocationGroupsByKey.get(
      resolveSameLocationGroupKey({
        longitude: entry.organization.longitude,
        latitude: entry.organization.latitude,
      }),
    )
    if (!group) continue

    if (group.organizations.length === 1) {
      const projected = map.project(entry.coordinates)
      if (
        !isProjectedPointVisible({
          map,
          x: projected.x,
          y: projected.y,
        })
      ) {
        continue
      }

      items.push({
        kind: "organization",
        key: `organization:${entry.organization.id}`,
        organization: entry.organization,
        projectedX: Math.round(projected.x),
        projectedY: Math.round(projected.y),
        selected: selectedOrganizationId === entry.organization.id,
      })
    }
  }

  for (const group of sameLocationGroupsByKey.values()) {
    if (group.organizations.length < 2) continue

    const projected = map.project(group.coordinates)
    if (
      !isProjectedPointVisible({
        map,
        x: projected.x,
        y: projected.y,
      })
    ) {
      continue
    }

    items.push({
      kind: "same-location-group",
      key: group.key,
      organizationIds: group.organizations.map((organization) => organization.id),
      organizations: group.organizations,
      locationLabel: group.locationLabel,
      projectedX: Math.round(projected.x),
      projectedY: Math.round(projected.y),
      selected:
        group.key === activeSameLocationGroupKey ||
        group.organizations.some((organization) => organization.id === selectedOrganizationId),
    })
  }

  return items
}

export function buildOverlayItems({
  map,
  organizationById,
  selectedOrganizationId,
  activeSameLocationGroupKey,
}: {
  map: mapboxgl.Map
  organizationById: Map<string, PublicMapOrganization>
  selectedOrganizationId: string | null
  activeSameLocationGroupKey: string | null
}) {
  const clusterItems = resolveVisibleClusterItems({
    map,
  })
  const organizationItems = resolveVisibleOrganizationAndGroupItems({
    map,
    organizationById,
    selectedOrganizationId,
    activeSameLocationGroupKey,
  })

  return [...clusterItems, ...organizationItems].sort((left, right) => {
    const zIndexDifference = resolveOverlayItemZIndex(left) - resolveOverlayItemZIndex(right)
    if (zIndexDifference !== 0) return zIndexDifference
    return left.key.localeCompare(right.key)
  })
}
