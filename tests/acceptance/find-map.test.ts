import { describe, expect, it } from "vitest"

import { FIND_MAP_FEATURE_NAME } from "@/features/find-map"

describe("find-map feature", () => {
  it("exposes a stable public feature entrypoint", () => {
    expect(FIND_MAP_FEATURE_NAME).toBe("find-map")
  })
})
