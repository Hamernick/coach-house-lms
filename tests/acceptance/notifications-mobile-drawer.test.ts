import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("notifications mobile drawer", () => {
  it("uses snap points and separates the mobile list from detail preview", () => {
    const menu = readSource("src/components/notifications/notifications-menu.tsx")
    const list = readSource("src/components/notifications/notifications-list.tsx")
    const preview = readSource("src/components/notifications/notification-preview.tsx")
    const drawer = readSource("src/components/ui/drawer.tsx")

    expect(menu).toContain("const NOTIFICATIONS_MOBILE_SNAP_POINTS = [0.62, 0.92]")
    expect(menu).toContain("activeSnapPoint={mobileSnapPoint}")
    expect(menu).toContain("setActiveSnapPoint={setMobileSnapPoint}")
    expect(menu).toContain("snapToSequentialPoint")
    expect(menu).toContain("handleOnly")
    expect(menu).toContain("h-[92dvh] max-h-[92dvh]")
    expect(menu).toContain("data-[vaul-drawer-direction=bottom]:max-h-[92dvh]")
    expect(menu).toContain("data-[vaul-drawer-direction=bottom]:mt-0")
    expect(menu).toContain("pb-[max(0.75rem,env(safe-area-inset-bottom))]")
    expect(menu).toContain("overscroll-contain touch-pan-y")
    expect(menu).toContain("setMobileDetailItemId(item.id)")
    expect(menu).toContain("setMobileSnapPoint(NOTIFICATIONS_MOBILE_SNAP_POINTS[1])")
    expect(menu).toContain("Back")
    expect(menu).toContain("className=\"min-h-0 max-h-none flex-1 border-t-0 md:border-l-0\"")
    expect(menu).toContain("className=\"h-full min-h-0 max-h-none\"")
    expect(menu).toContain("viewportClassName=\"h-full overscroll-contain touch-pan-y\"")
    expect(list).toContain("viewportClassName?: string")
    expect(list).toContain("viewportClassName={viewportClassName}")
    expect(list).toContain("overflow-hidden md:min-h-0 md:max-h-none")
    expect(list).toContain("\"h-auto w-full min-w-0")
    expect(preview).toContain("className?: string")
    expect(preview).toContain("\"flex min-h-[10rem]")
    expect(drawer).toContain("<DrawerHandle className=\"mt-4\" />")
  })
})
