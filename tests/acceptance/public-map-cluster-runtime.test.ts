import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import {
  coalesceClusterReconcileFeatures,
  queryClusterReconcileFeatures,
  queryVisibleUnclusteredOrganizationFeatures,
  resolveClusterClickTarget,
  shouldScheduleClusterRenderFromSourceData,
} from "@/components/public/public-map-index/public-map-cluster-runtime"
import { normalizeCoordinatesForMap } from "@/components/public/public-map-index/map-coordinate-normalization"
import {
  syncClusterSourceAndLayers,
  syncSelectedOrganizationLayers,
} from "@/components/public/public-map-index/map-layer-sync"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
} from "@/components/public/public-map-index/map-view-helpers"

function buildOrganization(overrides: Partial<PublicMapOrganization> = {}): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Alpha Org",
    tagline: null,
    description: null,
    boilerplate: null,
    vision: null,
    mission: null,
    values: null,
    needStatement: null,
    originStory: null,
    theoryOfChange: null,
    formationStatus: null,
    contactName: null,
    logoUrl: null,
    brandMarkUrl: null,
    headerUrl: null,
    website: null,
    email: null,
    phone: null,
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    brandPrimary: null,
    brandColors: [],
    brandThemePresetId: null,
    brandAccentPresetId: null,
    brandTypographyPresetId: null,
    brandTypography: null,
    brandKitAvailable: false,
    latitude: 41.8781,
    longitude: -87.6298,
    address: null,
    addressStreet: null,
    addressPostal: null,
    city: "Chicago",
    state: "IL",
    country: "United States",
    locationUrl: null,
    publicSlug: "alpha-org",
    programPreview: null,
    programs: [],
    programCount: 0,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
    ...overrides,
  }
}

describe("queryClusterReconcileFeatures", () => {
  it("returns an empty snapshot when source access throws during style teardown", () => {
    const map = {
      getSource: vi.fn(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'getOwnSource')")
      }),
      isMoving: vi.fn().mockReturnValue(false),
      queryRenderedFeatures: vi.fn(),
      querySourceFeatures: vi.fn(),
    } as unknown as mapboxgl.Map

    expect(queryClusterReconcileFeatures({ map })).toEqual([])
    expect(map.queryRenderedFeatures).not.toHaveBeenCalled()
    expect(map.querySourceFeatures).not.toHaveBeenCalled()
  })

  it("does not reconcile from rendered or source features while the map is moving", () => {
    const queryRenderedFeatures = vi.fn()
    const querySourceFeatures = vi.fn()
    const map = {
      getSource: vi.fn().mockReturnValue({}),
      isMoving: vi.fn().mockReturnValue(true),
      queryRenderedFeatures,
      querySourceFeatures,
    } as unknown as mapboxgl.Map

    expect(queryClusterReconcileFeatures({ map })).toEqual([])
    expect(queryRenderedFeatures).not.toHaveBeenCalled()
    expect(querySourceFeatures).not.toHaveBeenCalled()
  })

  it("prefers rendered cluster features once the camera is stable", () => {
    const renderedFeatures = [{ id: "rendered-feature" }]
    const map = {
      getSource: vi.fn().mockReturnValue({}),
      isMoving: vi.fn().mockReturnValue(false),
      queryRenderedFeatures: vi.fn().mockReturnValue(renderedFeatures),
      querySourceFeatures: vi.fn(),
    } as unknown as mapboxgl.Map

    expect(queryClusterReconcileFeatures({ map })).toBe(renderedFeatures)
    expect(map.querySourceFeatures).not.toHaveBeenCalled()
  })

  it("returns an empty snapshot when the camera is stable but rendered cluster layers are not ready yet", () => {
    const map = {
      getSource: vi.fn().mockReturnValue({}),
      isMoving: vi.fn().mockReturnValue(false),
      queryRenderedFeatures: vi.fn().mockReturnValue([]),
    } as unknown as mapboxgl.Map

    expect(queryClusterReconcileFeatures({ map })).toEqual([])
    expect(map.queryRenderedFeatures).toHaveBeenCalledTimes(1)
  })
})

describe("queryVisibleUnclusteredOrganizationFeatures", () => {
  it("returns an empty list when source access throws during style teardown", () => {
    const map = {
      getSource: vi.fn(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'getOwnSource')")
      }),
      querySourceFeatures: vi.fn(),
      queryRenderedFeatures: vi.fn(),
    } as unknown as mapboxgl.Map

    expect(queryVisibleUnclusteredOrganizationFeatures({ map })).toEqual([])
    expect(map.querySourceFeatures).not.toHaveBeenCalled()
    expect(map.queryRenderedFeatures).not.toHaveBeenCalled()
  })

  it("uses source features and keeps duplicate-coordinate organizations stable", () => {
    const inBoundsA = {
      geometry: {
        type: "Point",
        coordinates: [-87.6298, 41.8781],
      },
      properties: {
        organizationId: "org-a",
        name: "Org A",
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const inBoundsB = {
      geometry: {
        type: "Point",
        coordinates: [-87.6298, 41.8781],
      },
      properties: {
        organizationId: "org-b",
        name: "Org B",
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const duplicateTileCopy = {
      geometry: {
        type: "Point",
        coordinates: [-87.6298, 41.8781],
      },
      properties: {
        organizationId: "org-a",
        name: "Org A",
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const outOfBounds = {
      geometry: {
        type: "Point",
        coordinates: [-120, 20],
      },
      properties: {
        organizationId: "org-c",
        name: "Org C",
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const clusterFeature = {
      geometry: {
        type: "Point",
        coordinates: [-87.62, 41.87],
      },
      properties: {
        cluster: true,
        cluster_id: 11,
        point_count: 4,
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const map = {
      getSource: vi.fn().mockReturnValue({}),
      querySourceFeatures: vi
        .fn()
        .mockReturnValue([inBoundsA, inBoundsB, duplicateTileCopy, outOfBounds, clusterFeature]),
      getBounds: vi.fn().mockReturnValue({
        getWest: () => -90,
        getEast: () => -80,
        getSouth: () => 40,
        getNorth: () => 45,
      }),
      getCenter: vi.fn().mockReturnValue({ lng: -87.6298, lat: 41.8781 }),
    } as unknown as mapboxgl.Map

    const features = queryVisibleUnclusteredOrganizationFeatures({ map })
    const organizationIds = features.map(
      (feature) => (feature.properties as { organizationId?: string }).organizationId,
    )

    expect(map.querySourceFeatures).toHaveBeenCalledWith(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)
    expect(organizationIds).toEqual(["org-a", "org-b"])
  })
})

describe("shouldScheduleClusterRenderFromSourceData", () => {
  it("ignores unrelated sources", () => {
    const map = {
      isMoving: vi.fn().mockReturnValue(false),
    } as unknown as mapboxgl.Map

    expect(
      shouldScheduleClusterRenderFromSourceData({
        map,
        event: {
          sourceId: "another-source",
          dataType: "source",
          isSourceLoaded: true,
        } as mapboxgl.MapSourceDataEvent,
      }),
    ).toBe(false)
  })

  it("ignores source events while the map is moving", () => {
    const map = {
      isMoving: vi.fn().mockReturnValue(true),
    } as unknown as mapboxgl.Map

    expect(
      shouldScheduleClusterRenderFromSourceData({
        map,
        event: {
          sourceId: "public-map-organizations",
          dataType: "source",
          isSourceLoaded: true,
        } as mapboxgl.MapSourceDataEvent,
      }),
    ).toBe(false)
  })

  it("waits until the public-map source reports a loaded, stable update", () => {
    const map = {
      isMoving: vi.fn().mockReturnValue(false),
    } as unknown as mapboxgl.Map

    expect(
      shouldScheduleClusterRenderFromSourceData({
        map,
        event: {
          sourceId: "public-map-organizations",
          dataType: "source",
          isSourceLoaded: false,
        } as mapboxgl.MapSourceDataEvent,
      }),
    ).toBe(false)

    expect(
      shouldScheduleClusterRenderFromSourceData({
        map,
        event: {
          sourceId: "public-map-organizations",
          dataType: "source",
          isSourceLoaded: true,
        } as mapboxgl.MapSourceDataEvent,
      }),
    ).toBe(true)
  })
})

describe("coalesceClusterReconcileFeatures", () => {
  it("normalizes wrapped coordinates against the visible map center", () => {
    const map = {
      getCenter: vi.fn().mockReturnValue({
        lng: -87.6298,
        lat: 41.8781,
      }),
    } as unknown as mapboxgl.Map

    const [longitude, latitude] = normalizeCoordinatesForMap({
      map,
      coordinates: [272.3702, 41.8781],
    })

    expect(longitude).toBeCloseTo(-87.6298, 8)
    expect(latitude).toBe(41.8781)
  })

  it("keeps the rendered copy closest to the existing logical marker screen position", () => {
    const stableFeature = {
      geometry: {
        type: "Point",
        coordinates: [-87.6298, 41.8781],
      },
      properties: {
        cluster: true,
        cluster_id: 11,
        point_count: 4,
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const wrappedCopy = {
      geometry: {
        type: "Point",
        coordinates: [272.3702, 41.8781],
      },
      properties: {
        cluster: true,
        cluster_id: 11,
        point_count: 4,
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const map = {
      getCenter: vi.fn().mockReturnValue({ lng: -87.6298, lat: 41.8781 }),
      getCanvas: vi.fn().mockReturnValue({
        clientWidth: 1280,
        clientHeight: 720,
      }),
      getCanvasContainer: vi.fn().mockReturnValue({
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 1280,
          height: 720,
        }),
      }),
      project: vi.fn((coordinates: [number, number]) => ({
        x: coordinates[0] < 0 ? 124 : 1040,
        y: 240,
      })),
    } as unknown as mapboxgl.Map

    const markersByKey = new Map([
      [
        "cluster:11",
        {
          kind: "cluster" as const,
          marker: {
            getLngLat: vi.fn().mockReturnValue({
              lng: -87.6298,
              lat: 41.8781,
            }),
            getElement: vi.fn().mockReturnValue({
              getBoundingClientRect: vi.fn().mockReturnValue({
                left: 92,
                top: 206,
                width: 64,
                height: 68,
              }),
            }),
          } as unknown as mapboxgl.Marker,
          clusterActionState: {
            clusterId: 11,
            pointCount: 4,
            coordinates: [-87.6298, 41.8781] as [number, number],
          },
        },
      ],
    ])

    expect(
      coalesceClusterReconcileFeatures({
        map,
        features: [wrappedCopy, stableFeature],
        markersByKey,
      }),
    ).toEqual([stableFeature])
  })

  it("uses the visible rendered copy when resolving a cluster click target", () => {
    const wrappedCopy = {
      geometry: {
        type: "Point",
        coordinates: [272.3702, 41.8781],
      },
      properties: {
        cluster: true,
        cluster_id: 11,
        point_count: 4,
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const visibleCopy = {
      geometry: {
        type: "Point",
        coordinates: [-87.6298, 41.8781],
      },
      properties: {
        cluster: true,
        cluster_id: 11,
        point_count: 4,
      },
    } as unknown as mapboxgl.MapboxGeoJSONFeature

    const map = {
      getCenter: vi.fn().mockReturnValue({ lng: -87.6298, lat: 41.8781 }),
      project: vi.fn((coordinates: [number, number]) => ({
        x: coordinates[0] < 0 ? 640 : 1040,
        y: 320,
      })),
      queryRenderedFeatures: vi.fn().mockReturnValue([wrappedCopy, visibleCopy]),
    } as unknown as mapboxgl.Map

    expect(
      resolveClusterClickTarget({
        map,
        clusterId: 11,
        fallbackCoordinates: [-87.6298, 41.8781],
      }),
    ).toMatchObject({
      clusterId: 11,
    })
    const target = resolveClusterClickTarget({
      map,
      clusterId: 11,
      fallbackCoordinates: [-87.6298, 41.8781],
    })
    expect(target.coordinates[0]).toBeCloseTo(-87.6298, 8)
    expect(target.coordinates[1]).toBe(41.8781)
  })
})

describe("syncClusterSourceAndLayers", () => {
  it("returns cleanly when source access throws during style teardown", () => {
    const map = {
      getSource: vi.fn(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'getOwnSource')")
      }),
      addSource: vi.fn(),
      getLayer: vi.fn(),
      addLayer: vi.fn(),
      setFilter: vi.fn(),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn(),
    } as unknown as mapboxgl.Map

    expect(() =>
      syncClusterSourceAndLayers({
        map,
        organizations: [buildOrganization()],
      }),
    ).not.toThrow()
    expect(map.addSource).not.toHaveBeenCalled()
    expect(map.addLayer).not.toHaveBeenCalled()
  })

  it("creates visible cluster, count, point, and selected layers", () => {
    const layers = new Set<string>()
    const map = {
      getSource: vi.fn().mockReturnValue(undefined),
      addSource: vi.fn(),
      getLayer: vi.fn((id: string) => (layers.has(id) ? { id } : undefined)),
      addLayer: vi.fn((layer: { id: string }) => {
        layers.add(layer.id)
      }),
      setFilter: vi.fn(),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn(),
    } as unknown as mapboxgl.Map

    syncClusterSourceAndLayers({
      map,
      organizations: [buildOrganization()],
    })

    expect(map.addSource).toHaveBeenCalledWith(
      PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      expect.objectContaining({
        type: "geojson",
        cluster: true,
      }),
    )
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID }),
    )
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID }),
    )
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID }),
    )
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID }),
    )
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID }),
    )
  })

  it("updates point and selected filters when selection changes", () => {
    const map = {
      getLayer: vi.fn().mockReturnValue({ id: "layer" }),
      setFilter: vi.fn(),
    } as unknown as mapboxgl.Map

    syncSelectedOrganizationLayers({
      map,
      selectedOrganizationId: "org-42",
    })

    expect(map.setFilter).toHaveBeenCalledWith(
      PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
      [
        "all",
        ["!", ["has", "point_count"]],
        ["!=", ["get", "organizationId"], "org-42"],
      ],
    )
    expect(map.setFilter).toHaveBeenCalledWith(
      PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
      [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "organizationId"], "org-42"],
      ],
    )
    expect(map.setFilter).toHaveBeenCalledWith(
      PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
      [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "organizationId"], "org-42"],
      ],
    )
  })

  it("returns cleanly when layer access throws during style teardown", () => {
    const map = {
      getLayer: vi.fn(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'getOwnLayer')")
      }),
      setFilter: vi.fn(),
    } as unknown as mapboxgl.Map

    expect(() =>
      syncSelectedOrganizationLayers({
        map,
        selectedOrganizationId: "org-42",
      }),
    ).not.toThrow()
    expect(map.setFilter).not.toHaveBeenCalled()
  })
})
