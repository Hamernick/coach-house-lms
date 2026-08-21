import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { describe, expect, it } from "vitest"

import {
  FIND_MAP_FEATURE_NAME,
  FindMapLoadingSidebar,
  FindMapLoadingState,
} from "@/features/find-map"

const ROOT = process.cwd()

describe("find-map feature", () => {
  it("exposes a stable public feature entrypoint", () => {
    expect(FIND_MAP_FEATURE_NAME).toBe("find-map")
  })

  it("uses a layout-preserving initial state instead of generic skeletons", () => {
    const markup = renderToStaticMarkup(createElement(FindMapLoadingState))
    const sidebarMarkup = renderToStaticMarkup(
      createElement(FindMapLoadingSidebar)
    )
    const routeSource = readFileSync(
      join(ROOT, "src/app/(public)/find/loading.tsx"),
      "utf8"
    )
    const shellSource = readFileSync(
      join(ROOT, "src/components/public/home-canvas-find-shell.tsx"),
      "utf8"
    )

    expect(routeSource).toContain("<FindMapLoadingState />")
    expect(routeSource).toContain("<FindMapLoadingSidebar />")
    expect(routeSource).toContain("sidebarFallback={")
    expect(routeSource).toContain("showAuthActions={false}")
    expect(routeSource).toContain("function PublicFindLoading()")
    expect(routeSource).not.toContain("async function PublicFindLoading")
    expect(routeSource).not.toContain("fetchPublicMapViewerState")
    expect(routeSource).not.toContain("resolveDashboardLayoutState")
    expect(routeSource).not.toContain("Skeleton")
    expect(shellSource).toContain(
      '"--sidebar-width": sidebarFallback === null ? "23rem" : "15rem"'
    )
    expect(shellSource).toContain("hasSidebarSlot || sidebarFallback !== null")
    expect(sidebarMarkup).toContain('data-find-map-loading-sidebar=""')
    expect(sidebarMarkup).toContain('aria-hidden="true"')
    expect(markup).toContain('data-find-map-loading-state="layout-preserving"')
    expect(markup).toContain('data-find-map-loading-drawer=""')
    expect(markup).toContain("h-[168px]")
    expect(markup).toContain("rounded-t-[28px]")
    expect(markup).toContain("Find organizations and resources")
    expect(markup).toContain("Loading resources…")
    expect(markup).toContain('aria-busy="true"')
    expect(markup).toContain("motion-reduce:animate-none")
    expect(markup).not.toContain('data-slot="skeleton"')
    expect(markup.match(/animate-spin/g)).toHaveLength(1)
  })
})
