import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AccountSettingsDeleteAccountDialogBody } from "@/components/account-settings/account-settings-delete-account-dialog"
import { DangerSection } from "@/components/account-settings/sections/desktop/danger"

describe("account settings delete account flow", () => {
  it("warns paid users that account deletion does not cancel Stripe billing", () => {
    const dangerMarkup = renderToStaticMarkup(
      React.createElement(DangerSection, {
        onDeleteAccount: () => undefined,
        hasActiveSubscription: true,
      }),
    )

    const dialogMarkup = renderToStaticMarkup(
      React.createElement(AccountSettingsDeleteAccountDialogBody, {
        isDeletingAccount: false,
        deleteEmailInput: "",
        onDeleteEmailInputChange: () => undefined,
        accountEmail: "caleb@example.com",
        hasActiveSubscription: true,
        billingCancellationAcknowledged: false,
        onBillingCancellationAcknowledgedChange: () => undefined,
        canDeleteAccount: false,
        onConfirmDelete: () => undefined,
        onCancel: () => undefined,
      }),
    )

    expect(dangerMarkup).toContain("Deleting your account does not cancel Stripe billing.")
    expect(dialogMarkup).toContain("If Stripe billing is still active, account deletion will not cancel it.")
    expect(dialogMarkup).toContain(">1. Cancel your subscription billing<")
    expect(dialogMarkup).toContain(">Open billing portal<")
    expect(dialogMarkup).toContain(
      "I have canceled Stripe billing, or I understand account deletion will not stop it.",
    )
    expect(dialogMarkup).toContain(">2. Confirm your email<")
  })

  it("keeps the delete confirmation simple when no paid subscription is active", () => {
    const dialogMarkup = renderToStaticMarkup(
      React.createElement(AccountSettingsDeleteAccountDialogBody, {
        isDeletingAccount: false,
        deleteEmailInput: "",
        onDeleteEmailInputChange: () => undefined,
        accountEmail: "caleb@example.com",
        hasActiveSubscription: false,
        billingCancellationAcknowledged: false,
        onBillingCancellationAcknowledgedChange: () => undefined,
        canDeleteAccount: false,
        onConfirmDelete: () => undefined,
        onCancel: () => undefined,
      }),
    )

    expect(dialogMarkup).not.toContain("Open billing portal")
    expect(dialogMarkup).not.toContain("2. Confirm your email")
    expect(dialogMarkup).not.toContain("If Stripe billing is still active")
  })
})
