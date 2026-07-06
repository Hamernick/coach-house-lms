import { performance } from "node:perf_hooks"

import { logger } from "@/lib/logger"

type MeasureServerStepOptions = {
  thresholdMs?: number
  context?: Record<string, unknown>
}

const DEFAULT_SERVER_TIMING_THRESHOLD_MS = 1_000

function serverTimingsEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.LOG_SERVER_TIMINGS === "1"
  )
}

export async function measureServerStep<T>(
  step: string,
  work: () => Promise<T>,
  options: MeasureServerStepOptions = {}
): Promise<T> {
  const start = performance.now()

  try {
    return await work()
  } finally {
    const durationMs = performance.now() - start
    const thresholdMs =
      options.thresholdMs ?? DEFAULT_SERVER_TIMING_THRESHOLD_MS

    if (serverTimingsEnabled() && durationMs >= thresholdMs) {
      logger.info("server_step_timing", {
        step,
        durationMs: Number(durationMs.toFixed(1)),
        thresholdMs,
        ...options.context,
      })
    }
  }
}
