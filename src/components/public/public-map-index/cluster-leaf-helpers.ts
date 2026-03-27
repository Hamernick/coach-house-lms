import type mapboxgl from "mapbox-gl"

const CLUSTER_LEAF_PAGE_SIZE = 100

function getClusterLeavesPage({
  source,
  clusterId,
  limit,
  offset,
}: {
  source: mapboxgl.GeoJSONSource
  clusterId: number
  limit: number
  offset: number
}) {
  return new Promise<mapboxgl.MapboxGeoJSONFeature[]>((resolve, reject) => {
    source.getClusterLeaves(clusterId, limit, offset, (error, leaves) => {
      if (error) {
        reject(error)
        return
      }
      if (!Array.isArray(leaves)) {
        resolve([])
        return
      }
      resolve(leaves as mapboxgl.MapboxGeoJSONFeature[])
    })
  })
}

export async function fetchAllClusterLeaves({
  source,
  clusterId,
  pointCount,
  pageSize = CLUSTER_LEAF_PAGE_SIZE,
}: {
  source: mapboxgl.GeoJSONSource
  clusterId: number
  pointCount: number
  pageSize?: number
}) {
  const expectedCount = Math.max(0, Math.floor(pointCount))
  if (expectedCount === 0) return []

  const leaves: mapboxgl.MapboxGeoJSONFeature[] = []
  let offset = 0
  while (offset < expectedCount) {
    const nextLimit = Math.max(1, Math.min(pageSize, expectedCount - offset))
    const page = await getClusterLeavesPage({
      source,
      clusterId,
      limit: nextLimit,
      offset,
    })
    if (page.length === 0) break
    leaves.push(...page)
    offset += page.length
    if (page.length < nextLimit) break
  }
  return leaves
}
