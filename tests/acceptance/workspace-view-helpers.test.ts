import { describe, expect, it } from "vitest"

import { isUuidLike } from "@/app/(dashboard)/my-organization/_lib/workspace-view-helpers"

describe("workspace view helpers", () => {
  it("accepts persisted module UUIDs", () => {
    expect(isUuidLike("886455ec-a664-4f13-83f1-471ddd1f5ffd")).toBe(true)
  })

  it("rejects synthetic accelerator onboarding module ids", () => {
    expect(isUuidLike("workspace-onboarding-welcome")).toBe(false)
    expect(isUuidLike("workspace-onboarding-organization-setup")).toBe(false)
  })
})
