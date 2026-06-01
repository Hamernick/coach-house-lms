import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  resolveMemberWorkspaceNavAccess,
  shouldForceStripeEntitlementSyncForWorkspace,
} from "@/lib/workspace/member-workspace-nav-access"

const ROOT = process.cwd()

describe("member workspace nav access", () => {
  it("lets platform admins keep workspace nav even when a caller passes free-member access flags", () => {
    expect(
      resolveMemberWorkspaceNavAccess({
        isAdmin: true,
        showMemberWorkspace: false,
        hasActiveSubscription: false,
      }),
    ).toBe(true)
  })

  it("keeps self-only free members on the find-only nav path", () => {
    expect(
      resolveMemberWorkspaceNavAccess({
        isAdmin: false,
        showMemberWorkspace: false,
        hasActiveSubscription: false,
      }),
    ).toBe(false)
  })

  it("forces Stripe entitlement sync for non-admin users before hiding workspace nav", () => {
    expect(
      shouldForceStripeEntitlementSyncForWorkspace({
        isAdmin: false,
      }),
    ).toBe(true)
    expect(
      shouldForceStripeEntitlementSyncForWorkspace({
        isAdmin: true,
      }),
    ).toBe(false)
  })

  it("does not hide member workspace nav from org admins inside admin routes", () => {
    const shellSource = readFileSync(
      join(ROOT, "src/components/app-shell/app-shell-inner.tsx"),
      "utf8",
    )

    expect(shellSource).not.toContain("(!isAdminContext || isAdmin)")
    expect(shellSource).not.toContain("!isAdminContext &&\n    !isAcceleratorContext")
    expect(shellSource).toContain("canShowMemberWorkspace")
  })

  it("syncs missing Stripe subscription rows before protected member workspace pages redirect", () => {
    const accessSource = readFileSync(
      join(ROOT, "src/lib/workspace/member-workspace-access.ts"),
      "utf8",
    )
    const layoutStateSource = readFileSync(
      join(ROOT, "src/app/(dashboard)/_lib/dashboard-layout-state.ts"),
      "utf8",
    )

    expect(accessSource).toContain("fetchLearningEntitlements")
    expect(accessSource).toContain("forceStripeSync: true")
    expect(accessSource).toContain("syncedEntitlements.hasActiveSubscription")
    expect(layoutStateSource).toContain("shouldForceStripeEntitlementSyncForWorkspace")
    expect(layoutStateSource).toContain("forceStripeSync: shouldForceStripeEntitlementSyncForWorkspace")
    expect(layoutStateSource).toContain("Unable to load dashboard entitlement state.")
    expect(layoutStateSource).toContain("return entitlementFallback")
  })
})
