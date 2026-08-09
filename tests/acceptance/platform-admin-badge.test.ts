import { describe, expect, it } from "vitest"

import { badgeVariants } from "@/features/platform-admin-dashboard/upstream/components/ui/badge"

describe("platform admin badge", () => {
  it("keeps consistent space between icons and text", () => {
    expect(badgeVariants()).toContain("gap-1")
  })
})
