import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AccountSettingsDeleteAccountDialogBody } from "@/components/account-settings/account-settings-delete-account-dialog"
import { DangerSection } from "@/components/account-settings/sections/desktop/danger"
import type { AccountDeletionPreflight } from "@/lib/account-deletion/types"

const basePreflight: AccountDeletionPreflight = {
  canDelete: true,
  accountType: "free",
  billing: {
    hasCancellationRisk: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: null,
    planLabel: null,
  },
  counts: {
    ownedOrganizations: 0,
    ownedOrganizationMembers: 0,
    joinedOrganizations: 0,
    sharedWorkspaceAuthorReferences: 0,
    pendingAccessRequests: 0,
    pendingInvitesSent: 0,
  },
  cleanupPreview: [
    {
      id: "profile",
      label: "Profile and login",
      count: 1,
      disposition: "deleted",
    },
  ],
  warnings: [],
  blockingIssues: [],
}

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
        deletePreflight: {
          ...basePreflight,
          accountType: "paid_owner",
          billing: {
            hasCancellationRisk: true,
            stripeCustomerId: "cus_123",
            stripeSubscriptionId: "sub_123",
            status: "active",
            planLabel: "Organization",
          },
          warnings: [
            {
              id: "billing-risk",
              title: "Stripe billing may continue",
              description: "This account owns an active paid Stripe subscription.",
            },
          ],
        },
        isDeletePreflightLoading: false,
        deletePreflightError: null,
        billingCancellationAcknowledged: false,
        onBillingCancellationAcknowledgedChange: () => undefined,
        canDeleteAccount: false,
        onConfirmDelete: () => undefined,
        onCancel: () => undefined,
      }),
    )

    expect(dangerMarkup).toContain("Deleting your account does not cancel Stripe billing.")
    expect(dialogMarkup).toContain("If Stripe billing is still active, account deletion will not cancel it.")
    expect(dialogMarkup).toContain("Deletion impact")
    expect(dialogMarkup).toContain("Stripe billing may continue")
    expect(dialogMarkup).toContain("Cleanup preview")
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
        deletePreflight: basePreflight,
        isDeletePreflightLoading: false,
        deletePreflightError: null,
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

  it("shows explicit blockers when preflight says deletion cannot continue", () => {
    const dialogMarkup = renderToStaticMarkup(
      React.createElement(AccountSettingsDeleteAccountDialogBody, {
        isDeletingAccount: false,
        deleteEmailInput: "",
        onDeleteEmailInputChange: () => undefined,
        accountEmail: "caleb@example.com",
        hasActiveSubscription: false,
        deletePreflight: {
          ...basePreflight,
          canDelete: false,
          blockingIssues: [
            {
              id: "manual-review",
              title: "Manual review needed",
              description: "Support needs to resolve this account before deletion.",
            },
          ],
        },
        isDeletePreflightLoading: false,
        deletePreflightError: null,
        billingCancellationAcknowledged: false,
        onBillingCancellationAcknowledgedChange: () => undefined,
        canDeleteAccount: false,
        onConfirmDelete: () => undefined,
        onCancel: () => undefined,
      }),
    )

    expect(dialogMarkup).toContain("Before you can delete")
    expect(dialogMarkup).toContain("Manual review needed")
  })
})
