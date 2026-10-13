"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import FileSignatureIcon from "lucide-react/dist/esm/icons/file-signature"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import MessageSquareWarningIcon from "lucide-react/dist/esm/icons/message-square-warning"
import SendIcon from "lucide-react/dist/esm/icons/send"
import XCircleIcon from "lucide-react/dist/esm/icons/x-circle"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { FiscalSponsorshipProjectWorkbenchAdminActionProps } from "../types"
import { FiscalSponsorshipApplicationReviewDialog } from "./fiscal-sponsorship-application-review-dialog"

type PendingFiscalWorkbenchAction =
  | "approve"
  | "decline"
  | "generate"
  | "needs_info"
  | "send"
type ReviewDialogDecision = "needs_info" | "declined"

type FiscalSponsorshipProjectWorkbenchAdminActionsProps =
  FiscalSponsorshipProjectWorkbenchAdminActionProps & {
    agreementDocumentId?: string | null
    canApproveApplication?: boolean
    canGenerateAgreement?: boolean
    canSendAgreement?: boolean
    className?: string
    projectId: string
  }

function hasFiscalSponsorshipAdminActions({
  generateFiscalSponsorshipAgreementAction,
  reviewFiscalSponsorshipApplicationAction,
  sendFiscalSponsorshipAgreementForSignatureAction,
}: FiscalSponsorshipProjectWorkbenchAdminActionProps) {
  return Boolean(
    generateFiscalSponsorshipAgreementAction ||
    reviewFiscalSponsorshipApplicationAction ||
    sendFiscalSponsorshipAgreementForSignatureAction
  )
}

export function FiscalSponsorshipProjectWorkbenchAdminActions({
  agreementDocumentId,
  canApproveApplication = false,
  canGenerateAgreement = false,
  canSendAgreement = false,
  className,
  generateFiscalSponsorshipAgreementAction,
  projectId,
  reviewFiscalSponsorshipApplicationAction,
  sendFiscalSponsorshipAgreementForSignatureAction,
}: FiscalSponsorshipProjectWorkbenchAdminActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] =
    useState<PendingFiscalWorkbenchAction | null>(null)
  const [reviewDialogDecision, setReviewDialogDecision] =
    useState<ReviewDialogDecision | null>(null)

  if (
    !hasFiscalSponsorshipAdminActions({
      generateFiscalSponsorshipAgreementAction,
      reviewFiscalSponsorshipApplicationAction,
      sendFiscalSponsorshipAgreementForSignatureAction,
    })
  ) {
    return null
  }

  const runAction = (
    action: PendingFiscalWorkbenchAction,
    successMessage: string,
    callback: () => Promise<{ ok: true } | { error: string }>,
    onSuccess?: () => void
  ) => {
    setPendingAction(action)
    startTransition(async () => {
      const result = await callback()

      setPendingAction(null)

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(successMessage)
      onSuccess?.()
      router.refresh()
    })
  }

  const disabled = isPending || pendingAction !== null

  return (
    <div
      data-fiscal-sponsorship-project-workbench-admin-actions=""
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3"
        disabled={
          disabled ||
          !canApproveApplication ||
          !reviewFiscalSponsorshipApplicationAction
        }
        onClick={() =>
          runAction("approve", "Application approved", async () => {
            if (!reviewFiscalSponsorshipApplicationAction) {
              return { error: "Application review is unavailable." }
            }

            return reviewFiscalSponsorshipApplicationAction({
              decision: "approved",
              projectId,
            })
          })
        }
      >
        {pendingAction === "approve" ? (
          <Loader2Icon
            data-icon="inline-start"
            className="animate-spin"
            aria-hidden
          />
        ) : (
          <CheckCircle2Icon data-icon="inline-start" aria-hidden />
        )}
        Approve
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3"
        disabled={
          disabled ||
          !canApproveApplication ||
          !reviewFiscalSponsorshipApplicationAction
        }
        onClick={() => setReviewDialogDecision("needs_info")}
      >
        <MessageSquareWarningIcon data-icon="inline-start" aria-hidden />
        Needs info
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive h-8 rounded-full px-3"
        disabled={
          disabled ||
          !canApproveApplication ||
          !reviewFiscalSponsorshipApplicationAction
        }
        onClick={() => setReviewDialogDecision("declined")}
      >
        <XCircleIcon data-icon="inline-start" aria-hidden />
        Decline
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3"
        disabled={
          disabled ||
          !canGenerateAgreement ||
          !generateFiscalSponsorshipAgreementAction
        }
        onClick={() =>
          runAction("generate", "Agreement prepared", async () => {
            if (!generateFiscalSponsorshipAgreementAction) {
              return { error: "Agreement preparation is unavailable." }
            }

            const result = await generateFiscalSponsorshipAgreementAction({
              projectId,
            })

            return "error" in result ? result : { ok: true }
          })
        }
      >
        {pendingAction === "generate" ? (
          <Loader2Icon
            data-icon="inline-start"
            className="animate-spin"
            aria-hidden
          />
        ) : (
          <FileSignatureIcon data-icon="inline-start" aria-hidden />
        )}
        Prepare agreement
      </Button>
      <Button
        type="button"
        size="sm"
        className="h-8 rounded-full px-3"
        disabled={
          disabled ||
          !canSendAgreement ||
          !agreementDocumentId ||
          !sendFiscalSponsorshipAgreementForSignatureAction
        }
        onClick={() =>
          runAction("send", "Signature request sent", async () => {
            if (!sendFiscalSponsorshipAgreementForSignatureAction) {
              return { error: "Sending for signature is unavailable." }
            }

            const result =
              await sendFiscalSponsorshipAgreementForSignatureAction({
                documentId: agreementDocumentId,
                projectId,
              })

            return "error" in result ? result : { ok: true }
          })
        }
      >
        {pendingAction === "send" ? (
          <Loader2Icon
            data-icon="inline-start"
            className="animate-spin"
            aria-hidden
          />
        ) : (
          <SendIcon data-icon="inline-start" aria-hidden />
        )}
        Send for signature
      </Button>
      {reviewDialogDecision ? (
        <FiscalSponsorshipApplicationReviewDialog
          decision={reviewDialogDecision}
          open
          pending={
            pendingAction === "needs_info" || pendingAction === "decline"
          }
          onOpenChange={(open) => {
            if (!open && !pendingAction) setReviewDialogDecision(null)
          }}
          onConfirm={(notes) => {
            const decision = reviewDialogDecision
            runAction(
              decision === "needs_info" ? "needs_info" : "decline",
              decision === "needs_info"
                ? "Information request sent"
                : "Application declined",
              async () => {
                if (!reviewFiscalSponsorshipApplicationAction) {
                  return { error: "Application review is unavailable." }
                }

                return reviewFiscalSponsorshipApplicationAction({
                  decision,
                  notes,
                  projectId,
                })
              },
              () => setReviewDialogDecision(null)
            )
          }}
        />
      ) : null}
    </div>
  )
}
