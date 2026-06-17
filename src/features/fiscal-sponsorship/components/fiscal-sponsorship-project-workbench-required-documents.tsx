"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import XCircleIcon from "lucide-react/dist/esm/icons/x-circle"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  onOpenAssets?: () => void
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
  type: "connect" | Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
} | null

export function FiscalSponsorshipProjectWorkbenchRequiredDocuments({
  assets,
  canConnectDocuments = false,
  connectFiscalSponsorshipDocumentAssetAction,
  documents,
  legalEntityType = null,
  onOpenAssets,
  projectId,
  reviewFiscalSponsorshipDocumentAction,
}: FiscalSponsorshipProjectWorkbenchRequiredDocumentsProps) {
  const router = useRouter()
  const [selectedAssets, setSelectedAssets] = useState<
    Partial<Record<FiscalSponsorshipDocumentKey, string>>
  >({})
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
  const hasAssets = assets.length > 0
  const canConnectUploadedAssets = Boolean(
    canConnectDocuments && connectFiscalSponsorshipDocumentAssetAction
  )
  const canReviewDocuments = Boolean(reviewFiscalSponsorshipDocumentAction)

  function handleConnectDocument(key: FiscalSponsorshipDocumentKey) {
    if (!connectFiscalSponsorshipDocumentAssetAction) return

    const assetId = selectedAssets[key]
    if (!assetId) {
      toast.error("Choose a project asset to connect.")
      return
    }

    setPendingAction({ key, type: "connect" })
    startTransition(async () => {
      const result = await connectFiscalSponsorshipDocumentAssetAction({
        assetId,
        documentKey: key,
        projectId,
      })

      setPendingAction(null)

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success("Fiscal document connected")
      router.refresh()
    })
  }

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
          const selectedAssetId = selectedAssets[requirement.key] ?? ""
          const pendingForRow =
            isPending && pendingAction?.key === requirement.key
          const PendingIcon = pendingForRow ? Loader2Icon : null
          const RowIcon = connected ? CheckCircle2Icon : CircleDashedIcon

          return (
            <div
              key={requirement.key}
              className="flex min-w-0 flex-col gap-2 py-2.5"
              data-fiscal-sponsorship-required-document={requirement.key}
            >
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
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
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                    <RequiredDocumentLinkButton href={document.viewHref}>
                      <ExternalLinkIcon data-icon="inline-start" aria-hidden />
                      View
                    </RequiredDocumentLinkButton>
                    <RequiredDocumentLinkButton href={document.downloadHref}>
                      <DownloadIcon data-icon="inline-start" aria-hidden />
                      Download
                    </RequiredDocumentLinkButton>
                  </div>
                ) : null}
              </div>

              {!document && canConnectUploadedAssets ? (
                <div className="flex min-w-0 flex-col gap-2 pl-6 sm:flex-row sm:items-center">
                  {hasAssets ? (
                    <>
                      <Select
                        value={selectedAssetId}
                        onValueChange={(value) =>
                          setSelectedAssets((current) => ({
                            ...current,
                            [requirement.key]: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          className="h-8 min-w-0 text-xs sm:max-w-[18rem]"
                          aria-label={`Choose asset for ${requirement.label}`}
                        >
                          <SelectValue placeholder="Choose uploaded asset…" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3"
                        disabled={!selectedAssetId || pendingForRow}
                        onClick={() => handleConnectDocument(requirement.key)}
                      >
                        {PendingIcon ? (
                          <PendingIcon
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
                        Connect
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full px-3"
                      onClick={onOpenAssets}
                      disabled={!onOpenAssets}
                    >
                      <FolderOpenIcon data-icon="inline-start" aria-hidden />
                      Upload files
                    </Button>
                  )}
                </div>
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
          )
        })}
      </div>
    </section>
  )
}
