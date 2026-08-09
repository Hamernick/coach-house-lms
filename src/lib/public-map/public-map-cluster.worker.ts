import * as Comlink from "comlink"
import Supercluster from "supercluster"

import type {
  PublicMapClusterAggregateProperties,
  PublicMapClusterProperties,
  PublicMapFeatureCollection,
  PublicMapPointFeature,
  PublicMapPointProperties,
} from "./public-map-geojson"
import type { PublicMapClusterBbox } from "./public-map-bounds"
import {
  mapPublicMapClusterProperties,
  reducePublicMapClusterProperties,
} from "./public-map-cluster-aggregation"

const CLUSTER_OPTIONS = {
  radius: 36,
  maxZoom: 14,
  extent: 512,
  minPoints: 2,
} as const

let clusterIndex: Supercluster<
  PublicMapPointProperties,
  PublicMapClusterAggregateProperties
> | null = null
let clusterDataVersion: string | null = null

export type PublicMapClusterQueryRequest = {
  bbox: PublicMapClusterBbox
  zoom: number
  dataVersion: string
  querySeq: number
}

export type PublicMapClusterQueryResult = {
  dataVersion: string
  querySeq: number
  sourceData: PublicMapFeatureCollection
}

function buildEmptyFeatureCollection(): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [],
  }
}

function build(features: PublicMapPointFeature[], dataVersion: string) {
  if (clusterIndex && clusterDataVersion === dataVersion) {
    return {
      dataVersion,
      featureCount: features.length,
      reused: true,
    }
  }

  clusterIndex = new Supercluster<
    PublicMapPointProperties,
    PublicMapClusterAggregateProperties
  >({
    ...CLUSTER_OPTIONS,
    map: mapPublicMapClusterProperties,
    reduce: reducePublicMapClusterProperties,
  })
  clusterIndex.load(features)
  clusterDataVersion = dataVersion
  return {
    dataVersion,
    featureCount: features.length,
    reused: false,
  }
}

function getClusters({
  bbox,
  zoom,
  dataVersion,
  querySeq,
}: PublicMapClusterQueryRequest): PublicMapClusterQueryResult {
  if (!clusterIndex || clusterDataVersion !== dataVersion) {
    return {
      dataVersion,
      querySeq,
      sourceData: buildEmptyFeatureCollection(),
    }
  }

  return {
    dataVersion,
    querySeq,
    sourceData: {
      type: "FeatureCollection",
      features: clusterIndex.getClusters(bbox, zoom),
    },
  }
}

function getExpansionZoom(clusterId: number, dataVersion: string) {
  if (!clusterIndex || clusterDataVersion !== dataVersion) return null
  try {
    return clusterIndex.getClusterExpansionZoom(clusterId)
  } catch {
    return null
  }
}

function getLeaves(
  clusterId: number,
  limit: number,
  dataVersion: string,
  offset = 0
) {
  if (!clusterIndex || clusterDataVersion !== dataVersion) return []
  try {
    return clusterIndex.getLeaves(clusterId, limit, offset)
  } catch {
    return []
  }
}

export const publicMapClusterWorkerApi = {
  build,
  getClusters,
  getExpansionZoom,
  getLeaves,
}

export type PublicMapClusterWorkerApi = typeof publicMapClusterWorkerApi

Comlink.expose(publicMapClusterWorkerApi)
