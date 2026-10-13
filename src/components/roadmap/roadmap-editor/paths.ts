export function resolveRoadmapBasePath(pathname: string | null | undefined) {
  if (!pathname) return "/workspace/roadmap"
  if (pathname.startsWith("/workspace/roadmap")) return "/workspace/roadmap"
  if (pathname.startsWith("/accelerator/roadmap")) return "/workspace/roadmap"
  if (pathname.startsWith("/roadmap")) return "/workspace/roadmap"
  if (pathname.includes("/roadmap")) return "/workspace/roadmap"
  return "/workspace/roadmap"
}
