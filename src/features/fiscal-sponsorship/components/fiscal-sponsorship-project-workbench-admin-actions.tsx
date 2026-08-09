"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import FileSignatureIcon from "lucide-react/dist/esm/icons/file-signature"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import SendIcon from "lucide-react/dist/esm/icons/send"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { FiscalSponsorshipProjectWorkbenchAdminActionProps } from "../types"

type PendingFiscalWorkbenchAction = "approve" | "prepare" | "send"

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
  const [actionError, setActionError] = useState<string | null>(null)

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
    callback: () => Promise<{ ok: true } | { error: string }>
  ) => {
    setActionError(null)
    setPendingAction(action)
    startTransition(async () => {
      try {
        const result = await callback()

        if ("error" in result) {
          setActionError(result.error)
          toast.error(result.error)
          return
        }

        toast.success(successMessage)
        router.refresh()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to complete that fiscal sponsorship action."
        setActionError(message)
        toast.error(message)
      } finally {
        setPendingAction(null)
      }
    })
  }

  const disabled = isPending || pendingAction !== null
  const showApprove = Boolean(
    canApproveApplication && reviewFiscalSponsorshipApplicationAction
  )
  const showPrepare = Boolean(
    canGenerateAgreement && generateFiscalSponsorshipAgreementAction
  )
  const showSend = Boolean(
    canSendAgreement &&
    agreementDocumentId &&
    sendFiscalSponsorshipAgreementForSignatureAction
  )

  if (!showApprove && !showPrepare && !showSend) return null

  return (
    <div
      data-fiscal-sponsorship-project-workbench-admin-actions=""
      className={cn("flex shrink-0 flex-col items-end gap-1.5", className)}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        {showApprove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={disabled}
            aria-busy={pendingAction === "approve"}
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
            Approve application
          </Button>
        ) : null}
        {showPrepare ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={disabled}
            aria-busy={pendingAction === "prepare"}
            onClick={() =>
              runAction("prepare", "Agreement prepared", async () => {
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
            {pendingAction === "prepare" ? (
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
        ) : null}
        {showSend ? (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={disabled}
            aria-busy={pendingAction === "send"}
            onClick={() =>
              runAction("send", "Agreement sent for signature", async () => {
                if (!sendFiscalSponsorshipAgreementForSignatureAction) {
                  return { error: "Agreement sending is unavailable." }
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
        ) : null}
      </div>
      {actionError ? (
        <p
          role="alert"
          className="text-destructive max-w-72 text-right text-xs text-pretty"
        >
          {actionError}
        </p>
      ) : null}
    </div>
  )
}
