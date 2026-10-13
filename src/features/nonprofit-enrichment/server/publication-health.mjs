// Keep CLI resumes subject to the national operator's serving guard. No writes
// may follow a failed probe until bounded cooldown/rechecks establish recovery.
export function publicationHealth(
  client,
  {
    now = () => performance.now(),
    wait = (ms) => new Promise((done) => setTimeout(done, ms)),
    beforeProbe = async () => null,
    onProgress = () => {},
  } = {}
) {
  return async ({ number }) => {
    if (number % 10 === 0) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const maintenance = await beforeProbe()
          // A recovery needs two successful probes, not one lucky response.
          for (let probe = 0; probe < (attempt ? 2 : 1); probe++) {
            if (probe) await wait(500)
            const started = now()
            await client.publicRpc("search_nonprofit_directory", {
              p_query: "food",
              p_limit: 21,
            })
            const elapsedMs = now() - started
            onProgress({
              phase: "search_health",
              chunk: number,
              attempt,
              elapsedMs,
              maintenance,
            })
            if (!Number.isFinite(elapsedMs) || elapsedMs > 2000)
              throw new Error("Search health exceeded 2 seconds")
          }
          break
        } catch (error) {
          if (attempt === 2)
            throw new Error(
              `Search health failed after bounded cooldown; writes stopped: ${error.message}`
            )
          const delayMs = attempt === 0 ? 10000 : 30000
          onProgress({
            phase: "search_health_wait",
            chunk: number,
            attempt,
            delayMs,
            reason: error.message,
          })
          await wait(delayMs)
        }
      }
    }
    await wait(50)
  }
}
