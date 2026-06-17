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

type PendingFiscalWorkbenchAction = "approve" | "generate" | "send"

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
    setPendingAction(action)
    startTransition(async () => {
      const result = await callback()

      setPendingAction(null)

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(successMessage)
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
          !canGenerateAgreement ||
          !generateFiscalSponsorshipAgreementAction
        }
        onClick={() =>
          runAction("generate", "Agreement generated", async () => {
            if (!generateFiscalSponsorshipAgreementAction) {
              return { error: "Agreement generation is unavailable." }
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
        Generate
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
          runAction("send", "Agreement sent", async () => {
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
        Send
      </Button>
    </div>
  )
}
