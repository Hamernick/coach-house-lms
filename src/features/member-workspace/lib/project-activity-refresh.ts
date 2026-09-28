import { WORKSPACE_MUTATION_EVENT } from "@/lib/with-save-feedback"
import type { OrganizationActivityResult } from "./project-activity-types"

export function createActivityRefresh({
  load,
  onResult,
  onPending,
}: {
  load: () => Promise<OrganizationActivityResult>
  onResult: (result: OrganizationActivityResult) => void
  onPending: (pending: boolean) => void
}) {
  let pending = false
  let disposed = false
  let refreshAgain = false
  async function refresh(): Promise<void> {
    if (disposed) return
    if (pending) {
      refreshAgain = true
      return
    }
    pending = true
    onPending(true)
    try {
      const result = await load()
      if (!disposed) onResult(result)
    } catch {
      if (!disposed) onResult({ state: "error", items: [] })
    } finally {
      pending = false
      if (!disposed) onPending(false)
    }
    if (refreshAgain && !disposed) {
      refreshAgain = false
      await refresh()
    }
  }
  return {
    refresh,
    dispose() {
      disposed = true
    },
  }
}

export function startVisibleActivityPolling(refresh: () => Promise<void>) {
  const refreshVisible = () => {
    if (document.visibilityState === "visible") void refresh()
  }
  refreshVisible()
  const timer = window.setInterval(refreshVisible, 30_000)
  window.addEventListener(WORKSPACE_MUTATION_EVENT, refreshVisible)
  window.addEventListener("focus", refreshVisible)
  document.addEventListener("visibilitychange", refreshVisible)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener(WORKSPACE_MUTATION_EVENT, refreshVisible)
    window.removeEventListener("focus", refreshVisible)
    document.removeEventListener("visibilitychange", refreshVisible)
  }
}
