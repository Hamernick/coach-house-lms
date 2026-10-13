// Serving latency takes priority over throughput. No database maintenance or
// configuration changes belong in this read-only check.
import { publicationProbe } from "./publication-probe.mjs"

export function publicationLoadGuard(
  client,
  {
    now = () => performance.now(),
    wait = (ms) => new Promise((done) => setTimeout(done, ms)),
    shouldStop = () => false,
    checkResources = async () => {},
    onProgress = () => {},
    minGapMs = 5000,
    maxGapMs = 30000,
    maxDurationMs = 600000,
  } = {}
) {
  if (
    ![minGapMs, maxGapMs, maxDurationMs].every(Number.isSafeInteger) ||
    minGapMs < 1000 ||
    maxGapMs < minGapMs ||
    maxDurationMs < 1000
  )
    throw new Error("Invalid publication pacing limits")
  const startedAt = now()
  let lastWriteAt = null,
    gapMs = minGapMs
  function assertRunning() {
    if (shouldStop() || now() - startedAt >= maxDurationMs)
      throw new Error("Publication run stopped before write")
  }
  return async (event) => {
    assertRunning()
    if (lastWriteAt !== null) {
      const remaining = gapMs - (now() - lastWriteAt)
      if (remaining > 0) await wait(remaining)
    }
    assertRunning()
    await checkResources()
    let slowestMs = 0
    for (const [name, args] of [
      ["search_nonprofit_directory", { p_query: "food", p_limit: 21 }],
      [
        "search_nonprofit_directory",
        { p_query: "food", p_state: "IL", p_limit: 21 },
      ],
      // Stop-word states use the partial text index, without a state lexeme.
      [
        "search_nonprofit_directory",
        { p_query: "food", p_state: "IN", p_limit: 21 },
      ],
      [
        "search_nonprofit_directory",
        { p_query: "food", p_state: "OR", p_limit: 21 },
      ],
      ["search_nonprofit_directory_v2", { p_category: "food", p_limit: 1 }],
      [
        "search_nonprofit_directory_v2",
        { p_query: "food", p_category: "food", p_limit: 21 },
      ],
      [
        "search_nonprofit_directory_v2",
        { p_query: "housing", p_category: "food", p_limit: 21 },
      ],
    ]) {
      assertRunning()
      const { elapsedMs } = await publicationProbe(client, name, args, {
        now, onProgress, event,
      })
      slowestMs = Math.max(slowestMs, elapsedMs)
    }
    assertRunning()
    if (slowestMs > 500) gapMs = Math.min(maxGapMs, gapMs * 2)
    // Never accelerate within a run after a slow sample.
    onProgress({
      phase: "publication_before_write",
      ...event,
      slowestMs,
      gapMs,
    })
    lastWriteAt = now()
  }
}
