"use client"

import { BillingPortalLaunchButton } from "@/components/billing/billing-portal-launch-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
            ? " Deleting your profile does not cancel Stripe subscription billing."
            : null}{" "}
          Enter your email to confirm.
        </p>
      </div>
      <div className="space-y-4">
        {hasActiveSubscription ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">1. Cancel your subscription billing</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Account deletion does not stop Stripe billing. Open the billing portal and cancel your subscription before deleting this account.
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
                  aria-label="I understand I need to cancel Stripe billing separately before deleting my account"
                  className="mt-0.5"
                />
                <span>
                  I understand I need to cancel Stripe billing separately before deleting my account.
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
