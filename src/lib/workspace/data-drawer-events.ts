export type WorkspaceRoadmapDrawerRequest = {
  tab: "roadmap"
  roadmapSectionSlug: string
}

const WORKSPACE_ROADMAP_DRAWER_REQUEST_EVENT =
  "coach-house:workspace-roadmap-drawer-request"

function isWorkspaceRoadmapDrawerRequest(
  value: unknown
): value is WorkspaceRoadmapDrawerRequest {
  if (!value || typeof value !== "object") return false

  const request = value as Partial<WorkspaceRoadmapDrawerRequest>
  return (
    request.tab === "roadmap" &&
    typeof request.roadmapSectionSlug === "string" &&
    request.roadmapSectionSlug.trim().length > 0
  )
}

export function requestWorkspaceRoadmapDrawer(slug: string): boolean {
  const roadmapSectionSlug = slug.trim()
  if (typeof window === "undefined" || !roadmapSectionSlug) return false

  const event = new CustomEvent<WorkspaceRoadmapDrawerRequest>(
    WORKSPACE_ROADMAP_DRAWER_REQUEST_EVENT,
    {
      cancelable: true,
      detail: {
        tab: "roadmap",
        roadmapSectionSlug,
      },
    }
  )
  window.dispatchEvent(event)
  return event.defaultPrevented
}

export function listenForWorkspaceRoadmapDrawerRequests(
  listener: (request: WorkspaceRoadmapDrawerRequest) => void
) {
  if (typeof window === "undefined") return () => {}

  const handleRequest: EventListener = (event) => {
    if (
      !(event instanceof CustomEvent) ||
      !isWorkspaceRoadmapDrawerRequest(event.detail)
    ) {
      return
    }

    listener(event.detail)
    event.preventDefault()
  }

  window.addEventListener(WORKSPACE_ROADMAP_DRAWER_REQUEST_EVENT, handleRequest)
  return () =>
    window.removeEventListener(
      WORKSPACE_ROADMAP_DRAWER_REQUEST_EVENT,
      handleRequest
    )
}
