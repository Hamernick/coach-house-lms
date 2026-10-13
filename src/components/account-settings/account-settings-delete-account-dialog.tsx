"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type AccountSettingsDeleteAccountDialogProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  isDeletingAccount: boolean
  deleteEmailInput: string
  onDeleteEmailInputChange: (value: string) => void
  accountEmail: string
  canDeleteAccount: boolean
  onConfirmDelete: () => void
}

export function AccountSettingsDeleteAccountDialog({
  open,
  onOpenChange,
  isDeletingAccount,
  deleteEmailInput,
  onDeleteEmailInputChange,
  accountEmail,
  canDeleteAccount,
  onConfirmDelete,
}: AccountSettingsDeleteAccountDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isDeletingAccount) return
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account. Enter your email to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
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
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={onConfirmDelete} disabled={!canDeleteAccount}>
            {isDeletingAccount ? "Deleting..." : "Delete account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
