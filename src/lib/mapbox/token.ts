import "server-only"

export function getMapboxToken() {
  return (process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
}
