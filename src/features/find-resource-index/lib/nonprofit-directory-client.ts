import type { NonprofitDirectorySearchResponse } from "../nonprofit-types"

export async function loadNonprofitDirectoryPage(query: string, cursor: string | null, signal: AbortSignal) {
  const params = new URLSearchParams({ q: query, limit: "20" })
  if (cursor) params.set("cursor", cursor)
  const response = await fetch(`/api/public/nonprofits/search?${params}`, { signal, headers: { Accept: "application/json" } })
  if (!response.ok) throw new Error("Directory unavailable")
  const result = await response.json() as NonprofitDirectorySearchResponse
  if (result.version !== 1 || !Array.isArray(result.items) || result.items.length > 20 ||
    typeof result.page?.hasMore !== "boolean" || result.page.limit !== 20 ||
    (result.page.hasMore && typeof result.page.nextCursor !== "string")) throw new Error("Invalid directory response")
  return result
}
