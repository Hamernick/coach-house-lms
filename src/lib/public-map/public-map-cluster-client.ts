import * as Comlink from "comlink"
import Supercluster from "supercluster"

import type {
  PublicMapClusterProperties,
  PublicMapFeatureCollection,
  PublicMapPointFeature,
  PublicMapPointProperties,
} from "./public-map-geojson"
import type {
  PublicMapClusterQueryRequest,
  PublicMapClusterQueryResult,
  PublicMapClusterWorkerApi,
} from "./public-map-cluster.worker"

type PublicMapClusterBuildResult = {
  dataVersion: string
  featureCount: number
  reused: boolean
}

export type PublicMapClusterClient = {
  build: (
    features: PublicMapPointFeature[],
    dataVersion: string,
  ) => Promise<PublicMapClusterBuildResult>
  getClusters: (
    request: PublicMapClusterQueryRequest,
  ) => Promise<PublicMapClusterQueryResult>
  getExpansionZoom: (clusterId: number, dataVersion: string) => Promise<number | null>
  getLeaves: (
    clusterId: number,
    limit: number,
    dataVersion: string,
  ) => Promise<PublicMapPointFeature[]>
  destroy: () => void
}

type PublicMapClusterClientOptions = {
  workerApi?: PublicMapClusterWorkerApi
}

const CLUSTER_OPTIONS = {
  radius: 36,
  maxZoom: 14,
  extent: 512,
  minPoints: 2,
} as const

function buildEmptyFeatureCollection(): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [],
  }
}

function createLocalPublicMapClusterIndex() {
  let clusterIndex: Supercluster<PublicMapPointProperties, PublicMapClusterProperties> | null =
    null
  let clusterDataVersion: string | null = null

  return {
    build(features: PublicMapPointFeature[], dataVersion: string): PublicMapClusterBuildResult {
      if (clusterIndex && clusterDataVersion === dataVersion) {
        return {
          dataVersion,
          featureCount: features.length,
          reused: true,
        }
      }

      clusterIndex = new Supercluster<PublicMapPointProperties, PublicMapClusterProperties>(
        CLUSTER_OPTIONS,
      )
      clusterIndex.load(features)
      clusterDataVersion = dataVersion
      return {
        dataVersion,
        featureCount: features.length,
        reused: false,
      }
    },
    getClusters({
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
    },
    getExpansionZoom(clusterId: number, dataVersion: string) {
      if (!clusterIndex || clusterDataVersion !== dataVersion) return null
      try {
        return clusterIndex.getClusterExpansionZoom(clusterId)
      } catch {
        return null
      }
    },
    getLeaves(clusterId: number, limit: number, dataVersion: string) {
      if (!clusterIndex || clusterDataVersion !== dataVersion) return []
      try {
        return clusterIndex.getLeaves(clusterId, limit)
      } catch {
        return []
      }
    },
  }
}

function buildEmptyClusterQueryResult({
  dataVersion,
  querySeq,
}: Pick<PublicMapClusterQueryRequest, "dataVersion" | "querySeq">): PublicMapClusterQueryResult {
  return {
    dataVersion,
    querySeq,
    sourceData: buildEmptyFeatureCollection(),
  }
}

function shouldUsePublicMapClusterResult(
  result: Pick<PublicMapClusterQueryResult, "dataVersion" | "querySeq">,
  expected: Pick<PublicMapClusterQueryRequest, "dataVersion" | "querySeq">,
) {
  return result.dataVersion === expected.dataVersion && result.querySeq === expected.querySeq
}

export { shouldUsePublicMapClusterResult }

export function createPublicMapClusterClient(
  options: PublicMapClusterClientOptions = {},
): PublicMapClusterClient {
  const local = createLocalPublicMapClusterIndex()
  let worker: Worker | null = null
  let remote: PublicMapClusterWorkerApi | Comlink.Remote<PublicMapClusterWorkerApi> | null =
    options.workerApi ?? null
  let activeDataVersion: string | null = null
  let workerFailed = false
  let destroyed = false
  let fallbackReady = false
  let latestFeatures: PublicMapPointFeature[] = []
  let latestDataVersion = ""

  if (!remote) {
    try {
      worker = new Worker(new URL("./public-map-cluster.worker.ts", import.meta.url), {
        type: "module",
      })
      worker.addEventListener("error", () => {
        workerFailed = true
      })
      remote = Comlink.wrap<PublicMapClusterWorkerApi>(worker)
    } catch {
      workerFailed = true
    }
  }

  const ensureFallbackIndex = (features = latestFeatures, dataVersion = latestDataVersion) => {
    const result = local.build(features, dataVersion)
    fallbackReady = true
    activeDataVersion = dataVersion
    return result
  }

  const buildWorkerIndex = async (
    features: PublicMapPointFeature[],
    dataVersion: string,
  ) => {
    if (!remote || workerFailed) return null
    return await Promise.resolve(remote.build(features, dataVersion))
  }

  return {
    async build(features, dataVersion) {
      if (destroyed) {
        return {
          dataVersion,
          featureCount: 0,
          reused: false,
        }
      }
      if (activeDataVersion === dataVersion) {
        return {
          dataVersion,
          featureCount: features.length,
          reused: true,
        }
      }

      latestFeatures = features
      latestDataVersion = dataVersion

      try {
        const result = await buildWorkerIndex(features, dataVersion)
        if (result) {
          fallbackReady = false
          activeDataVersion = dataVersion
          return result
        }
      } catch {
        workerFailed = true
      }

      return ensureFallbackIndex(features, dataVersion)
    },
    async getClusters(request) {
      if (destroyed) return buildEmptyClusterQueryResult(request)
      if (request.dataVersion !== activeDataVersion) {
        return buildEmptyClusterQueryResult(request)
      }

      if (remote && !workerFailed && !fallbackReady) {
        try {
          return await Promise.resolve(remote.getClusters(request))
        } catch {
          workerFailed = true
          ensureFallbackIndex()
        }
      }

      return local.getClusters(request)
    },
    async getExpansionZoom(clusterId, dataVersion) {
      if (destroyed || dataVersion !== activeDataVersion) return null
      if (remote && !workerFailed && !fallbackReady) {
        try {
          return await Promise.resolve(remote.getExpansionZoom(clusterId, dataVersion))
        } catch {
          workerFailed = true
          ensureFallbackIndex()
        }
      }
      return local.getExpansionZoom(clusterId, dataVersion)
    },
    async getLeaves(clusterId, limit, dataVersion) {
      if (destroyed || dataVersion !== activeDataVersion) return []
      const boundedLimit = Math.max(0, Math.floor(limit))
      if (boundedLimit === 0) return []

      if (remote && !workerFailed && !fallbackReady) {
        try {
          return await Promise.resolve(remote.getLeaves(clusterId, boundedLimit, dataVersion))
        } catch {
          workerFailed = true
          ensureFallbackIndex()
        }
      }

      return local.getLeaves(clusterId, boundedLimit, dataVersion)
    },
    destroy() {
      destroyed = true
      worker?.terminate()
    },
  }
}
