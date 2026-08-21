import type { PublicMapSidebarProps } from "./sidebar-contract"

export function resetPublicMapDrawer(
  setActiveSnapIndex: (value: 0) => void,
  setDrawerTab: (value: "directory") => void,
  setSidebarMode: PublicMapSidebarProps["setSidebarMode"]
) {
  setActiveSnapIndex(0)
  setDrawerTab("directory")
  setSidebarMode("search")
}

export function resolveEffectivePublicMapSidebarMode({
  compact,
  selectedOrganization,
  selectedResourceItem,
  sidebarMode,
}: Pick<
  PublicMapSidebarProps,
  "selectedOrganization" | "selectedResourceItem" | "sidebarMode"
> & { compact: boolean }) {
  if (compact && sidebarMode === "hidden") return "search"
  if (
    sidebarMode === "details" &&
    !selectedOrganization &&
    !selectedResourceItem
  ) {
    return "search"
  }
  return sidebarMode
}

export function resolvePublicMapDrawerViewportHeight({
  activeSnapPoint,
  fullscreen,
}: {
  activeSnapPoint: string | number
  fullscreen: boolean
}) {
  return fullscreen
    ? "calc(100% - 2.75rem)"
    : `calc(${activeSnapPoint} - 2.75rem)`
}
