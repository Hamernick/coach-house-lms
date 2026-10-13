import { describe, expect, it } from "vitest"

import { normalizePlatformAdminManifest } from "../../scripts/provision-platform-admins.mjs"

describe("platform admin provisioning manifest", () => {
  it("normalizes emails and optional fields", () => {
    expect(
      normalizePlatformAdminManifest([
        {
          email: " A@Example.com ",
          fullName: " Admin User ",
          password: " TempPass!123 ",
        },
      ]),
    ).toEqual([
      {
        email: "a@example.com",
        fullName: "Admin User",
        password: "TempPass!123",
        role: "admin",
      },
    ])
  })

  it("rejects duplicate emails", () => {
    expect(() =>
      normalizePlatformAdminManifest([
        { email: "a@example.com" },
        { email: "A@example.com" },
      ]),
    ).toThrow(/duplicate email/i)
  })
})
