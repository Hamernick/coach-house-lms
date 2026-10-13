import { monitorEventLoopDelay } from "node:perf_hooks"

function startLoopMonitor() {
  const histogram = monitorEventLoopDelay({ resolution: 20 })
  histogram.enable()
  return () => {
    histogram.disable()
    return histogram.max / 1e6
  }
}

// Timings describe the client-observed request, not SQL execution time.
// Never include returned records, tokens, or arbitrary error text in telemetry.
export async function publicationProbe(client, name, args, {
  now = () => performance.now(),
  wallNow = Date.now,
  monitorLoop = startLoopMonitor,
  onProgress = () => {},
  event = {},
} = {}) {
  const stopMonitor = monitorLoop()
  const start = now(), wallStart = wallNow()
  let rows, failure, elapsedMs, failed = false
  try {
    rows = await client.publicRpc(name, args)
  } catch (error) {
    failed = true
    failure = error
  } finally {
    elapsedMs = now() - start
    const wallElapsedMs = wallNow() - wallStart
    const eventLoopDelayMaxMs = stopMonitor()
    const outcome = failed ? "rpc_error"
      : !Array.isArray(rows) ? "invalid_response"
      : !Number.isFinite(elapsedMs) || elapsedMs < 0 ? "invalid_timing"
      : elapsedMs > 2000 ? "slow" : "passed"
    // Existing client errors expose the Postgres code in parentheses.
    const code = /\(([A-Z0-9]{5})\)/.exec(String(failure ?? ""))?.[1] ?? null
    onProgress({
      ...event,
      phase: "publication_search_probe",
      name, args, outcome, elapsedMs, wallElapsedMs, eventLoopDelayMaxMs,
      startedAtMs: wallStart,
      rows: Array.isArray(rows) ? rows.length : null,
      errorCode: code,
    })
    if (failed) throw failure
    if (outcome !== "passed")
      throw new Error(`Public search unhealthy; stopped before write: ${name} ${JSON.stringify(args)} (${outcome}, ${elapsedMs}ms)`)
  }
  return { rows, elapsedMs }
}
