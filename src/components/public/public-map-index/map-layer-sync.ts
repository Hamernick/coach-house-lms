import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  buildPublicMapOrganizationFeatureCollection,
  PUBLIC_MAP_CLUSTER_MAX_ZOOM,
  PUBLIC_MAP_CLUSTER_RADIUS,
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
} from "./map-view-helpers"
import { ensureSpiderfyRailLayer } from "./overlap-expansion"

const PUBLIC_MAP_NO_SELECTION_FILTER_ID = "__public-map-no-selection__"

function resolveVisiblePointFilter(selectedOrganizationId: string | null) {
  if (!selectedOrganizationId) {
    return ["!", ["has", "point_count"]] as mapboxgl.FilterSpecification
  }
  return [
    "all",
    ["!", ["has", "point_count"]],
    ["!=", ["get", "organizationId"], selectedOrganizationId],
  ] as mapboxgl.FilterSpecification
}

function resolveSelectedPointFilter(selectedOrganizationId: string | null) {
  return [
    "all",
    ["!", ["has", "point_count"]],
    [
      "==",
      ["get", "organizationId"],
      selectedOrganizationId ?? PUBLIC_MAP_NO_SELECTION_FILTER_ID,
    ],
  ] as mapboxgl.FilterSpecification
}

export function syncSelectedOrganizationLayers({
  map,
  selectedOrganizationId,
}: {
  map: mapboxgl.Map
  selectedOrganizationId: string | null
}) {
  if (map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID)) {
    map.setFilter(
      PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
      resolveVisiblePointFilter(selectedOrganizationId),
    )
  }

  const selectedFilter = resolveSelectedPointFilter(selectedOrganizationId)
  if (map.getLayer(PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID)) {
    map.setFilter(PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID, selectedFilter)
  }
  if (map.getLayer(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID)) {
    map.setFilter(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, selectedFilter)
  }
}

export function syncClusterSourceAndLayers({
  map,
  organizations,
}: {
  map: mapboxgl.Map
  organizations: PublicMapOrganization[]
}) {
  ensureSpiderfyRailLayer(map)
  const sourceData = buildPublicMapOrganizationFeatureCollection(organizations)
  if (process.env.NODE_ENV !== "production") {
    const expectedFeatures = organizations.filter(
      (organization) =>
        typeof organization.longitude === "number" &&
        Number.isFinite(organization.longitude) &&
        typeof organization.latitude === "number" &&
        Number.isFinite(organization.latitude),
    ).length
    const uniqueFeatureIds = new Set(
      sourceData.features.map((feature) => feature.properties.organizationId),
    ).size
    if (
      sourceData.features.length !== expectedFeatures ||
      uniqueFeatureIds !== sourceData.features.length
    ) {
      console.warn("[public-map] source integrity mismatch", {
        expectedFeatures,
        actualFeatures: sourceData.features.length,
        uniqueFeatureIds,
      })
    }
  }

  const existingSource = map.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined
  if (existingSource) {
    existingSource.setData(sourceData)
  } else {
    map.addSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID, {
      type: "geojson",
      data: sourceData,
      cluster: true,
      clusterRadius: PUBLIC_MAP_CLUSTER_RADIUS,
      clusterMaxZoom: PUBLIC_MAP_CLUSTER_MAX_ZOOM,
    })
  }

  if (!map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(10, 18, 34, 0.88)",
        "circle-radius": [
          "step",
          ["get", "point_count"],
          18,
          5,
          24,
          20,
          30,
          100,
          36,
        ],
        "circle-stroke-color": "rgba(255, 255, 255, 0.72)",
        "circle-stroke-width": 2,
        "circle-opacity": 0.96,
      },
    })
  }
  map.setFilter(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, ["has", "point_count"])
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, "circle-color", "rgba(10, 18, 34, 0.88)")
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, "circle-radius", [
    "step",
    ["get", "point_count"],
    18,
    5,
    24,
    20,
    30,
    100,
    36,
  ])
  map.setPaintProperty(
    PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
    "circle-stroke-color",
    "rgba(255, 255, 255, 0.72)",
  )
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, "circle-stroke-width", 2)
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, "circle-opacity", 0.96)

  if (!map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID)) {
    map.addLayer({
      id: PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": [
          "step",
          ["get", "point_count"],
          12,
          5,
          13,
          20,
          14,
          100,
          15,
        ],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "rgba(248, 250, 252, 0.98)",
      },
    })
  }
  map.setFilter(PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID, ["has", "point_count"])
  map.setLayoutProperty(PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID, "text-field", [
    "get",
    "point_count_abbreviated",
  ])
  map.setLayoutProperty(PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID, "text-size", [
    "step",
    ["get", "point_count"],
    12,
    5,
    13,
    20,
    14,
    100,
    15,
  ])
  map.setLayoutProperty(PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID, "text-font", [
    "Open Sans Semibold",
    "Arial Unicode MS Bold",
  ])
  map.setLayoutProperty(PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID, "text-allow-overlap", true)
  map.setPaintProperty(
    PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID,
    "text-color",
    "rgba(248, 250, 252, 0.98)",
  )

  if (!map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID)) {
    map.addLayer({
      id: PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": 7,
        "circle-color": "rgba(10, 18, 34, 0.88)",
        "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
        "circle-stroke-width": 2,
        "circle-opacity": 0.01,
      },
    })
  }
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID, "circle-radius", 7)
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID, "circle-color", "rgba(10, 18, 34, 0.88)")
  map.setPaintProperty(
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "circle-stroke-color",
    "rgba(255, 255, 255, 0.9)",
  )
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID, "circle-stroke-width", 2)
  map.setPaintProperty(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID, "circle-opacity", 0.01)

  if (!map.getLayer(PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID)) {
    map.addLayer({
      id: PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveSelectedPointFilter(null),
      paint: {
        "circle-radius": 17,
        "circle-color": "rgba(255, 255, 255, 0.18)",
        "circle-stroke-color": "rgba(255, 255, 255, 0.72)",
        "circle-stroke-width": 2,
        "circle-opacity": 0.01,
      },
    })
  }
  map.setPaintProperty(PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID, "circle-radius", 17)
  map.setPaintProperty(
    PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
    "circle-color",
    "rgba(255, 255, 255, 0.18)",
  )
  map.setPaintProperty(
    PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
    "circle-stroke-color",
    "rgba(255, 255, 255, 0.72)",
  )
  map.setPaintProperty(PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID, "circle-stroke-width", 2)
  map.setPaintProperty(PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID, "circle-opacity", 0.01)

  if (!map.getLayer(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID)) {
    map.addLayer({
      id: PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveSelectedPointFilter(null),
      paint: {
        "circle-radius": 10,
        "circle-color": "rgba(12, 22, 44, 0.96)",
        "circle-stroke-color": "rgba(255, 255, 255, 0.96)",
        "circle-stroke-width": 3,
        "circle-opacity": 0.01,
      },
    })
  }
  map.setPaintProperty(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, "circle-radius", 10)
  map.setPaintProperty(
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "circle-color",
    "rgba(12, 22, 44, 0.96)",
  )
  map.setPaintProperty(
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "circle-stroke-color",
    "rgba(255, 255, 255, 0.96)",
  )
  map.setPaintProperty(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, "circle-stroke-width", 3)
  map.setPaintProperty(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, "circle-opacity", 0.01)

  syncSelectedOrganizationLayers({
    map,
    selectedOrganizationId: null,
  })
}
