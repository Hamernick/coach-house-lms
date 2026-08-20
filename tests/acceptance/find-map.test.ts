import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { describe, expect, it } from "vitest"

import { FIND_MAP_FEATURE_NAME, FindMapLoadingState } from "@/features/find-map"

const ROOT = process.cwd()

describe("find-map feature", () => {
  it("exposes a stable public feature entrypoint", () => {
    expect(FIND_MAP_FEATURE_NAME).toBe("find-map")
  })

  it("uses a layout-preserving initial state instead of generic skeletons", () => {
    const markup = renderToStaticMarkup(createElement(FindMapLoadingState))
    const routeSource = readFileSync(
      join(ROOT, "src/app/(public)/find/loading.tsx"),
      "utf8"
    )

    expect(routeSource).toContain("<FindMapLoadingState />")
    expect(routeSource).toContain("fetchPublicMapViewerState()")
    expect(routeSource).toContain("<AuthenticatedFindShell")
    expect(routeSource).toContain("resolveDashboardLayoutState()")
    expect(routeSource).toContain("showAuthActions={false}")
    expect(routeSource).not.toContain("Skeleton")
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
