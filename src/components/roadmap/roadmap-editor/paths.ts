import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

export function resolveRoadmapBasePath(pathname: string | null | undefined) {
  if (!pathname) return WORKSPACE_ROADMAP_PATH
  if (pathname.startsWith(WORKSPACE_ROADMAP_PATH)) {
    return WORKSPACE_ROADMAP_PATH
  }
  if (pathname.startsWith("/accelerator/roadmap")) return WORKSPACE_ROADMAP_PATH
  if (pathname.startsWith("/roadmap")) return WORKSPACE_ROADMAP_PATH
  if (pathname.includes("/roadmap")) return WORKSPACE_ROADMAP_PATH
  return WORKSPACE_ROADMAP_PATH
}
