import { describe, expect, it } from "vitest"

import { resolveOrganizationInviteEmailDeliveryDescription } from "@/features/organization-access"

describe("workspace board invite sheet feedback", () => {
  it("hides internal resend config details for existing-user access requests", () => {
    expect(
      resolveOrganizationInviteEmailDeliveryDescription({
        emailError: "RESEND_API_KEY is not configured.",
        kind: "existing_user_request",
      }),
    ).toBe(
      "The access request is pending in Team Access, but email notifications are unavailable right now.",
    )
  })

  it("hides internal resend config details for external invites", () => {
    expect(
      resolveOrganizationInviteEmailDeliveryDescription({
        emailError: "RESEND_API_KEY is not configured.",
        kind: "external_invite",
      }),
    ).toBe("Email delivery is unavailable right now. Share the copied invite link instead.")
  })

  it("preserves non-config delivery errors", () => {
    expect(
      resolveOrganizationInviteEmailDeliveryDescription({
        emailError: "Resend request failed with status 429.",
        kind: "existing_user_request",
      }),
    ).toBe("Resend request failed with status 429.")
  })
})
