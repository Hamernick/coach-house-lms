export type PublicMapIndexPresentationMode = "home-canvas" | "app-shell"

export function shouldRenderPublicMapDesktopSidebar(
  presentationMode: PublicMapIndexPresentationMode,
) {
  return presentationMode === "app-shell"
}

export function shouldUsePublicMapHomeCanvasSidebarSlot(
  presentationMode: PublicMapIndexPresentationMode,
) {
  return presentationMode === "home-canvas"
}
