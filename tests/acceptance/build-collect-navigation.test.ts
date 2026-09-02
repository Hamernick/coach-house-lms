import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  BUILD_NAVIGATION_ITEMS,
  COLLECT_NAVIGATION_ITEMS,
} from "@/features/build-collect-navigation"

const ROOT = process.cwd()

function readSource(path: string) {
  return readFileSync(join(ROOT, path), "utf8")
}

describe("build-collect-navigation feature contract", () => {
  it("keeps Collect at the canonical root and exposes real builder destinations", () => {
    expect(COLLECT_NAVIGATION_ITEMS[0]?.href).toBe("/")
    expect(BUILD_NAVIGATION_ITEMS.map((item) => item.href)).toEqual([
      "/workspace",
      "/accelerator",
      "/pricing",
    ])
  })

  it("uses an accessible shadcn navigation menu and a working root search form", () => {
    const source = readSource(
      "src/features/build-collect-navigation/components/build-collect-public-header.tsx"
    )

    expect(source).toContain("<NavigationMenu")
    expect(source).toContain("<NavigationMenuTrigger")
    expect(source).toContain('<form action="/" method="get"')
    expect(source).toContain('name="q"')
    expect(source).toContain('href: "/build"')
  })

  it("keeps the build route composition-only and delegates its UI to the feature", () => {
    const route = readSource("src/app/(public)/build/page.tsx")

    expect(route).toContain(
      'import { BuildPublicLanding } from "@/features/build-collect-navigation"'
    )
    expect(route).toContain("return <BuildPublicLanding />")
    expect(route).not.toContain("<main")
  })

  it("places the shared public header in the root Find shell", () => {
    const shell = readSource(
      "src/components/public/home-canvas-preview-shell.tsx"
    )

    expect(shell).toContain("BuildCollectPublicHeader")
    expect(shell).toContain(
      'activeArea={activeSection === "find" ? "collect" : "build"}'
    )
  })
})
