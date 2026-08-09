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
          accessLevel: "coach",
        },
      ])
    ).toEqual([
      {
        email: "a@example.com",
        fullName: "Admin User",
        password: "TempPass!123",
        accessLevel: "coach",
      },
    ])
  })

  it("rejects duplicate emails", () => {
    expect(() =>
      normalizePlatformAdminManifest([
        { email: "a@example.com" },
        { email: "A@example.com" },
      ])
    ).toThrow(/duplicate email/i)
  })

  it("defaults to developer and rejects unknown access levels", () => {
    expect(
      normalizePlatformAdminManifest([{ email: "developer@example.com" }])
    ).toEqual([
      {
        email: "developer@example.com",
        fullName: null,
        password: null,
        accessLevel: "developer",
      },
    ])

    expect(() =>
      normalizePlatformAdminManifest([
        { email: "staff@example.com", accessLevel: "owner" },
      ])
    ).toThrow(/invalid accessLevel/i)
  })
})
