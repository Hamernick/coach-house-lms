"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileUpIcon from "lucide-react/dist/esm/icons/file-up"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import XCircleIcon from "lucide-react/dist/esm/icons/x-circle"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { filterFiscalSponsorshipRequiredDocuments } from "../lib/required-documents"
import type {
  ConnectFiscalSponsorshipDocumentAssetResult,
  FiscalSponsorshipDocumentKey,
  FiscalSponsorshipDocumentReviewStatus,
  FiscalSponsorshipLegalEntityType,
  FiscalSponsorshipProjectAssetOption,
  FiscalSponsorshipProjectWorkflowSummaryDocument,
  ReviewFiscalSponsorshipDocumentResult,
} from "../types"
import {
  buildDocumentLookup,
  formatReviewStatus,
  getStatusTone,
  RequiredDocumentLinkButton,
  reviewDecisionRequiresNote,
} from "./fiscal-sponsorship-project-workbench-required-documents-support"
import { FiscalSponsorshipRequiredDocumentConnectPanel } from "./fiscal-sponsorship-required-document-connect-panel"

type FiscalSponsorshipProjectWorkbenchRequiredDocumentsProps = {
  assets: FiscalSponsorshipProjectAssetOption[]
  canConnectDocuments?: boolean
  connectFiscalSponsorshipDocumentAssetAction?: (input: {
    assetId: string
    documentKey: FiscalSponsorshipDocumentKey
    projectId: string
  }) => Promise<ConnectFiscalSponsorshipDocumentAssetResult>
  documents: FiscalSponsorshipProjectWorkflowSummaryDocument[]
  legalEntityType?: FiscalSponsorshipLegalEntityType | null
  projectId: string
  reviewFiscalSponsorshipDocumentAction?: (input: {
    decision: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
    documentId: string
    notes?: string | null
    projectId: string
  }) => Promise<ReviewFiscalSponsorshipDocumentResult>
}

type PendingRequiredDocumentAction = {
  documentId?: string
  key: FiscalSponsorshipDocumentKey
  type: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
} | null

export function FiscalSponsorshipProjectWorkbenchRequiredDocuments({
  assets,
  canConnectDocuments = false,
  connectFiscalSponsorshipDocumentAssetAction,
  documents,
  legalEntityType = null,
  projectId,
  reviewFiscalSponsorshipDocumentAction,
}: FiscalSponsorshipProjectWorkbenchRequiredDocumentsProps) {
  const router = useRouter()
  const [expandedUploadKey, setExpandedUploadKey] =
    useState<FiscalSponsorshipDocumentKey | null>(null)
  const [pendingAction, setPendingAction] =
    useState<PendingRequiredDocumentAction>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const documentLookup = useMemo(
    () => buildDocumentLookup(documents),
    [documents]
  )
  const connectedKeys = useMemo(
    () => new Set(documentLookup.keys()),
    [documentLookup]
  )
  const visibleRequirements = useMemo(
    () =>
      filterFiscalSponsorshipRequiredDocuments({
        connectedKeys,
        legalEntityType,
        showPostSignature: true,
      }),
    [connectedKeys, legalEntityType]
  )
  const canConnectUploadedAssets = Boolean(
    canConnectDocuments && connectFiscalSponsorshipDocumentAssetAction
  )
  const canReviewDocuments = Boolean(reviewFiscalSponsorshipDocumentAction)

  function handleReviewDocument({
    decision,
    document,
  }: {
    decision: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
    document: FiscalSponsorshipProjectWorkflowSummaryDocument
  }) {
    if (!reviewFiscalSponsorshipDocumentAction || !document.documentKey) return

    const notes = reviewNotes[document.id]?.trim() ?? ""
    if (reviewDecisionRequiresNote(decision) && !notes) {
      toast.error("Add a review note before requesting changes.")
      return
    }

    setPendingAction({
      documentId: document.id,
      key: document.documentKey,
      type: decision,
    })
    startTransition(async () => {
      const result = await reviewFiscalSponsorshipDocumentAction({
        decision,
        documentId: document.id,
        notes: notes || null,
        projectId,
      })

      setPendingAction(null)

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(
        `Document marked ${formatReviewStatus(decision).toLowerCase()}`
      )
      router.refresh()
    })
  }

  return (
    <section data-fiscal-sponsorship-required-documents="" className="min-w-0">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold">Required documents</p>
        <p className="text-muted-foreground text-xs leading-snug">
          Connect uploaded project assets to the handbook requirements so Coach
          House can review them before agreement and grant-request steps.
        </p>
      </div>
      <div className="divide-border/70 mt-2 divide-y divide-dashed">
        {visibleRequirements.map((requirement) => {
          const document = documentLookup.get(requirement.key) ?? null
          const connected = Boolean(document)
          const pendingForRow =
            isPending && pendingAction?.key === requirement.key
          const RowIcon = connected ? CheckCircle2Icon : CircleDashedIcon
          const uploadExpanded = expandedUploadKey === requirement.key

          return (
            <Collapsible
              key={requirement.key}
              open={uploadExpanded}
              onOpenChange={(open) =>
                setExpandedUploadKey(open ? requirement.key : null)
              }
              className="py-1.5"
            >
              <div
                className="flex min-w-0 flex-col gap-2 py-1"
                data-fiscal-sponsorship-required-document={requirement.key}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <RowIcon
                      className={cn(
                        "mt-1 size-4 shrink-0",
                        connected ? "text-emerald-600" : "text-amber-600"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="text-foreground truncate text-xs font-medium">
                          {requirement.label}
                        </p>
                        <Badge
                          className={cn(
                            "h-6 rounded-full border-transparent px-2 py-0.5 text-[11px] leading-none",
                            getStatusTone(document?.reviewStatus)
                          )}
                        >
                          {formatReviewStatus(document?.reviewStatus)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug">
                        {document?.title || requirement.description}
                      </p>
                    </div>
                  </div>

                  {document ? (
                    <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <RequiredDocumentLinkButton href={document.viewHref}>
                        <ExternalLinkIcon
                          data-icon="inline-start"
                          aria-hidden
                        />
                        View
                      </RequiredDocumentLinkButton>
                      <RequiredDocumentLinkButton href={document.downloadHref}>
                        <DownloadIcon data-icon="inline-start" aria-hidden />
                        Download
                      </RequiredDocumentLinkButton>
                    </div>
                  ) : canConnectUploadedAssets &&
                    connectFiscalSponsorshipDocumentAssetAction ? (
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group ml-auto h-8 shrink-0 rounded-full px-3"
                      >
                        <FileUpIcon data-icon="inline-start" aria-hidden />
                        Upload files
                        <ChevronDownIcon
                          data-icon="inline-end"
                          className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                          aria-hidden
                        />
                      </Button>
                    </CollapsibleTrigger>
                  ) : null}
                </div>

                {!document &&
                canConnectUploadedAssets &&
                connectFiscalSponsorshipDocumentAssetAction ? (
                  <CollapsibleContent
                    forceMount
                    className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 overflow-hidden data-[state=closed]:hidden data-[state=open]:duration-200 motion-reduce:data-[state=open]:animate-none"
                  >
                    <div className="pt-1 pb-2 pl-6">
                      <FiscalSponsorshipRequiredDocumentConnectPanel
                        assets={assets}
                        connectDocumentAssetAction={
                          connectFiscalSponsorshipDocumentAssetAction
                        }
                        description={requirement.description}
                        documentKey={requirement.key}
                        label={requirement.label}
                        projectId={projectId}
                      />
                    </div>
                  </CollapsibleContent>
                ) : null}

                {document && canReviewDocuments ? (
                  <div className="grid min-w-0 gap-2 pl-6">
                    <Textarea
                      aria-label={`Review note for ${requirement.label}`}
                      name={`fiscal-review-note-${document.id}`}
                      placeholder="Add review note for needs info or rejection…"
                      value={reviewNotes[document.id] ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [document.id]: event.target.value,
                        }))
                      }
                      className="min-h-16 resize-none rounded-xl shadow-none"
                    />
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3"
                        disabled={pendingForRow}
                        onClick={() =>
                          handleReviewDocument({
                            decision: "accepted",
                            document,
                          })
                        }
                      >
                        {pendingAction?.documentId === document.id &&
                        pendingAction.type === "accepted" ? (
                          <Loader2Icon
                            data-icon="inline-start"
                            className="animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <CheckCircle2Icon
                            data-icon="inline-start"
                            aria-hidden
                          />
                        )}
                        Accept
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3"
                        disabled={pendingForRow}
                        onClick={() =>
                          handleReviewDocument({
                            decision: "needs_info",
                            document,
                          })
                        }
                      >
                        Needs info
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 rounded-full px-3"
                        disabled={pendingForRow}
                        onClick={() =>
                          handleReviewDocument({
                            decision: "rejected",
                            document,
                          })
                        }
                      >
                        <XCircleIcon data-icon="inline-start" aria-hidden />
                        Reject
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3"
                        disabled={pendingForRow}
                        onClick={() =>
                          handleReviewDocument({
                            decision: "not_required",
                            document,
                          })
                        }
                      >
                        Not required
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Collapsible>
          )
        })}
      </div>
    </section>
  )
}
