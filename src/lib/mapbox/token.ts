import "server-only"

export function getMapboxToken() {
  return (
    process.env.MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    ""
  ).trim()
}

export function getPublicMapboxToken() {
  return (
    [process.env.NEXT_PUBLIC_MAPBOX_TOKEN, process.env.MAPBOX_TOKEN]
      .map((value) => value?.trim() ?? "")
      .find((value) => value.startsWith("pk.")) ?? ""
  )
}
