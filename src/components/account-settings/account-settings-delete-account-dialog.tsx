"use client"

import { BillingPortalLaunchButton } from "@/components/billing/billing-portal-launch-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AccountDeletionPreflight } from "@/lib/account-deletion/types"
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog"

type AccountSettingsDeleteAccountDialogProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  isDeletingAccount: boolean
  deleteEmailInput: string
  onDeleteEmailInputChange: (value: string) => void
  accountEmail: string
  hasActiveSubscription: boolean
  deletePreflight: AccountDeletionPreflight | null
  isDeletePreflightLoading: boolean
  deletePreflightError: string | null
  billingCancellationAcknowledged: boolean
  onBillingCancellationAcknowledgedChange: (next: boolean) => void
  canDeleteAccount: boolean
  onConfirmDelete: () => void
}

type AccountSettingsDeleteAccountDialogBodyProps = Omit<
  AccountSettingsDeleteAccountDialogProps,
  "open" | "onOpenChange"
> & {
  onCancel: () => void
}

export function AccountSettingsDeleteAccountDialogBody({
  isDeletingAccount,
  deleteEmailInput,
  onDeleteEmailInputChange,
  accountEmail,
  hasActiveSubscription,
  deletePreflight,
  isDeletePreflightLoading,
  deletePreflightError,
  billingCancellationAcknowledged,
  onBillingCancellationAcknowledgedChange,
  canDeleteAccount,
  onConfirmDelete,
  onCancel,
}: AccountSettingsDeleteAccountDialogBodyProps) {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center sm:text-left">
        <h2 className="text-lg leading-none font-semibold">Delete account?</h2>
        <p className="text-sm text-muted-foreground">
          This permanently deletes your account.
          {hasActiveSubscription
            ? " If Stripe billing is still active, account deletion will not cancel it."
            : null}{" "}
          Enter your email to confirm.
        </p>
      </div>
      <div className="space-y-4">
        {isDeletePreflightLoading ? (
          <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
            Checking account deletion status...
          </div>
        ) : null}

        {deletePreflightError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {deletePreflightError}
          </div>
        ) : null}

        {deletePreflight?.blockingIssues.length ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-foreground">Before you can delete</p>
            <div className="mt-2 space-y-2">
              {deletePreflight.blockingIssues.map((issue) => (
                <div key={issue.id} className="text-sm">
                  <p className="font-medium text-foreground">{issue.title}</p>
                  <p className="text-muted-foreground">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {deletePreflight?.warnings.length ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-sm font-medium text-foreground">Deletion impact</p>
            <div className="mt-2 space-y-2">
              {deletePreflight.warnings.map((warning) => (
                <div key={warning.id} className="text-sm">
                  <p className="font-medium text-foreground">{warning.title}</p>
                  <p className="text-muted-foreground">{warning.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {deletePreflight?.cleanupPreview.length ? (
          <div className="rounded-md border border-border/70 bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">Cleanup preview</p>
            <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
              {deletePreflight.cleanupPreview.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <span>{item.label}</span>
                  <span className="text-xs text-foreground">
                    {item.count} {item.disposition}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hasActiveSubscription ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">1. Cancel your subscription billing</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Account deletion does not stop Stripe billing. Open the billing portal to cancel first, or continue if you already canceled and your access remains active through the paid period.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <BillingPortalLaunchButton className="w-full sm:w-fit" />
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={billingCancellationAcknowledged}
                  onCheckedChange={(checked) =>
                    onBillingCancellationAcknowledgedChange(checked === true)
                  }
                  disabled={isDeletingAccount}
                  aria-label="I have canceled Stripe billing or understand account deletion will not stop it"
                  className="mt-0.5"
                />
                <span>
                  I have canceled Stripe billing, or I understand account deletion will not stop it.
                </span>
              </label>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {hasActiveSubscription ? "2. Confirm your email" : "Confirm your email"}
          </p>
          <Input
            value={deleteEmailInput}
            onChange={(event) => onDeleteEmailInputChange(event.currentTarget.value)}
            placeholder={accountEmail || "you@example.com"}
            autoComplete="off"
            aria-label="Confirm account email"
            disabled={isDeletingAccount}
          />
          <p className="text-xs text-muted-foreground">
            Type <span className="font-medium text-foreground">{accountEmail || "your account email"}</span> to continue.
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isDeletingAccount}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirmDelete} disabled={!canDeleteAccount}>
          {isDeletingAccount ? "Deleting..." : "Delete account"}
        </Button>
      </div>
    </>
  )
}

export function AccountSettingsDeleteAccountDialog({
  open,
  onOpenChange,
  ...props
}: AccountSettingsDeleteAccountDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (props.isDeletingAccount) return
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AccountSettingsDeleteAccountDialogBody
          {...props}
          onCancel={() => onOpenChange(false)}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
