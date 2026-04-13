import type mapboxgl from "mapbox-gl"

export const DEFAULT_MARKER_OVERLAP_BUCKET_THRESHOLD_PX = 18

export type MarkerOverlapBucketMember<T> = {
  key: string
  coordinates: [number, number]
  point: { x: number; y: number }
  item: T
}

export type MarkerOverlapBucket<T> = {
  key: string
  coordinates: [number, number]
  point: { x: number; y: number }
  members: MarkerOverlapBucketMember<T>[]
}

function resolveDistanceSquared(
  left: { x: number; y: number },
  right: { x: number; y: number },
) {
  const deltaX = left.x - right.x
  const deltaY = left.y - right.y
  return deltaX * deltaX + deltaY * deltaY
}

export function resolveMarkerOverlapBuckets<T>({
  map,
  items,
  getKey,
  getCoordinates,
  thresholdPx = DEFAULT_MARKER_OVERLAP_BUCKET_THRESHOLD_PX,
}: {
  map: mapboxgl.Map
  items: T[]
  getKey: (item: T) => string
  getCoordinates: (item: T) => [number, number]
  thresholdPx?: number
}) {
  const entries = items
    .map((item) => {
      const key = getKey(item)
      const coordinates = getCoordinates(item)
      const point = map.project(coordinates)
      return {
        key,
        coordinates,
        point: {
          x: point.x,
          y: point.y,
        },
        item,
      } satisfies MarkerOverlapBucketMember<T>
    })
    .sort((left, right) => {
      if (left.point.y !== right.point.y) return left.point.y - right.point.y
      if (left.point.x !== right.point.x) return left.point.x - right.point.x
      return left.key.localeCompare(right.key)
    })

  if (entries.length === 0) return [] satisfies MarkerOverlapBucket<T>[]

  const thresholdSquared = Math.max(0, thresholdPx) * Math.max(0, thresholdPx)
  const visited = new Set<number>()
  const buckets: MarkerOverlapBucket<T>[] = []

  for (let index = 0; index < entries.length; index += 1) {
    if (visited.has(index)) continue

    const queue = [index]
    visited.add(index)
    const component: MarkerOverlapBucketMember<T>[] = []

    while (queue.length > 0) {
      const currentIndex = queue.shift()
      if (currentIndex === undefined) break
      const current = entries[currentIndex]
      if (!current) continue

      component.push(current)

      for (let candidateIndex = 0; candidateIndex < entries.length; candidateIndex += 1) {
        if (visited.has(candidateIndex)) continue
        const candidate = entries[candidateIndex]
        if (!candidate) continue
        if (resolveDistanceSquared(current.point, candidate.point) > thresholdSquared) continue
        visited.add(candidateIndex)
        queue.push(candidateIndex)
      }
    }

    const members = component.sort((left, right) => left.key.localeCompare(right.key))
    const anchorPoint =
      members.length === 1
        ? members[0]!.point
        : {
            x: members.reduce((sum, member) => sum + member.point.x, 0) / members.length,
            y: members.reduce((sum, member) => sum + member.point.y, 0) / members.length,
          }
    const anchorCoordinates =
      members.length === 1
        ? members[0]!.coordinates
        : (() => {
            const lngLat = map.unproject([anchorPoint.x, anchorPoint.y])
            return [lngLat.lng, lngLat.lat] as [number, number]
          })()

    buckets.push({
      key: members.map((member) => member.key).join("|"),
      coordinates: anchorCoordinates,
      point: anchorPoint,
      members,
    })
  }

  return buckets.sort((left, right) => {
    if (left.point.y !== right.point.y) return left.point.y - right.point.y
    if (left.point.x !== right.point.x) return left.point.x - right.point.x
    return left.key.localeCompare(right.key)
  })
}
