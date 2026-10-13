export function publicationResourceCheck({
  target,
  token,
  fetchImpl = fetch,
  now = Date.now,
  onProgress = () => {},
}) {
  if (!/^[a-z0-9]{20}$/.test(target) || !token)
    throw new Error("Explicit resource-check target and token required")
  let lastCheckedAt = null
  let previousPaging = null
  async function get(path) {
    const response = await fetchImpl(
      `https://api.supabase.com/v1/projects/${target}${path}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!response.ok)
      throw new Error(`Resource check failed HTTP ${response.status}`)
    return response
  }
  return async () => {
    if (lastCheckedAt !== null && now() - lastCheckedAt < 30000) return
    const health = await (
      await get("/health?services=db&services=rest&services=auth")
    ).json()
    if (
      !Array.isArray(health) ||
      !["db", "rest", "auth"].every((name) =>
        health.some(
          (service) => service.name === name && service.healthy === true
        )
      )
    )
      throw new Error("Supabase service unhealthy; stopped before write")
    const metrics = await (await get("/analytics/endpoints/metrics")).text()
    const value = (name, optional = false) => {
      const lines = metrics
        .split("\n")
        .filter(
          (line) =>
            line.startsWith(`${name}{`) &&
            line.includes(`supabase_project_ref="${target}"`)
        )
      if (optional && lines.length !== 1) return null
      if (lines.length !== 1)
        throw new Error(`Missing or ambiguous metric: ${name}`)
      const number = Number(lines[0].trim().split(/\s+/).at(-1))
      if (!Number.isFinite(number) || number < 0)
        throw new Error(`Invalid metric: ${name}`)
      return number
    }
    const total = value("node_memory_MemTotal_bytes")
    const available = value("node_memory_MemAvailable_bytes")
    if (
      !total ||
      available > total ||
      available < Math.max(64 * 1024 * 1024, total * 0.15)
    )
      throw new Error("Insufficient memory headroom; stopped before write")
    lastCheckedAt = now()
    const paging = {
      checkedAt: lastCheckedAt,
      swapInPages: value("node_vmstat_pswpin", true),
      swapOutPages: value("node_vmstat_pswpout", true),
    }
    const sampleMs = previousPaging ? paging.checkedAt - previousPaging.checkedAt : null
    const delta = (field) => previousPaging && sampleMs > 0 &&
      paging[field] !== null && previousPaging[field] !== null &&
      paging[field] >= previousPaging[field]
      ? paging[field] - previousPaging[field] : null
    const swapInPagesDelta = delta("swapInPages")
    const swapOutPagesDelta = delta("swapOutPages")
    previousPaging = paging
    onProgress({
      phase: "publication_resources",
      checkedAt: lastCheckedAt,
      memoryTotalBytes: total,
      memoryAvailableBytes: available,
      swapTotalBytes: value("node_memory_SwapTotal_bytes", true),
      swapFreeBytes: value("node_memory_SwapFree_bytes", true),
      ...paging,
      sampleMs,
      swapInPagesDelta,
      swapOutPagesDelta,
    })
  }
}
