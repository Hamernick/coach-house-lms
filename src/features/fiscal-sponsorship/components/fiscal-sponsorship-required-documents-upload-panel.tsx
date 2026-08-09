"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileSignatureIcon from "lucide-react/dist/esm/icons/file-signature"
import FileUpIcon from "lucide-react/dist/esm/icons/file-up"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import { connectFiscalSponsorshipDocumentAsset } from "../actions"
import {
  filterFiscalSponsorshipRequiredDocuments,
  FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS,
} from "../lib/required-documents"
import { uploadFiscalSponsorshipProjectAsset } from "../lib/project-asset-upload"
import type {
  FiscalSponsorshipDocumentKey,
  FiscalSponsorshipLegalEntityType,
  FiscalSponsorshipProjectWorkflowSummaryDocument,
} from "../types"
import { RequiredDocumentReviewBadge } from "./fiscal-sponsorship-project-workbench-required-documents-support"

type FiscalSponsorshipRequiredDocumentsUploadPanelProps = {
  applicationReady: boolean
  canCompleteW9?: boolean
  documents: FiscalSponsorshipProjectWorkflowSummaryDocument[]
  legalEntityType?: FiscalSponsorshipLegalEntityType | null
  onOpenApplication?: () => void
  projectId: string
  showGrantRequestSupport?: boolean
}

type PendingUpload = {
  key: FiscalSponsorshipDocumentKey
  label: string
} | null

function buildDocumentLookup(
  documents: FiscalSponsorshipProjectWorkflowSummaryDocument[]
) {
  const lookup = new Map<
    FiscalSponsorshipDocumentKey,
    FiscalSponsorshipProjectWorkflowSummaryDocument
  >()

  for (const document of documents) {
    if (!document.documentKey || lookup.has(document.documentKey)) continue
    lookup.set(document.documentKey, document)
  }

  return lookup
}

function getUploadLabel({
  document,
}: {
  document: FiscalSponsorshipProjectWorkflowSummaryDocument | null
}) {
  if (!document) return "Upload document"
  if (
    document.reviewStatus === "needs_info" ||
    document.reviewStatus === "rejected"
  ) {
    return "Upload new version"
  }

  return "Replace file"
}

function shouldShowUploadAction(
  document: FiscalSponsorshipProjectWorkflowSummaryDocument | null
) {
  return (
    !document ||
    document.reviewStatus === "needs_info" ||
    document.reviewStatus === "rejected"
  )
}

function RequirementDocumentLinks({
  document,
}: {
  document: FiscalSponsorshipProjectWorkflowSummaryDocument
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {document.viewHref ? (
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full">
          <a href={document.viewHref} target="_blank" rel="noreferrer">
            <ExternalLinkIcon data-icon="inline-start" aria-hidden />
            View
          </a>
        </Button>
      ) : null}
      {document.downloadHref ? (
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full">
          <a href={document.downloadHref} target="_blank" rel="noreferrer">
            <DownloadIcon data-icon="inline-start" aria-hidden />
            Download
          </a>
        </Button>
      ) : null}
    </div>
  )
}

export function FiscalSponsorshipRequiredDocumentsUploadPanel({
  applicationReady,
  canCompleteW9 = false,
  documents,
  legalEntityType = null,
  onOpenApplication,
  projectId,
  showGrantRequestSupport = false,
}: FiscalSponsorshipRequiredDocumentsUploadPanelProps) {
  const router = useRouter()
  const [filesByKey, setFilesByKey] = React.useState<
    Partial<Record<FiscalSponsorshipDocumentKey, File>>
  >({})
  const [pendingUpload, setPendingUpload] = React.useState<PendingUpload>(null)
  const [isPending, startTransition] = React.useTransition()
  const documentLookup = React.useMemo(
    () => buildDocumentLookup(documents),
    [documents]
  )
  const connectedKeys = React.useMemo(
    () => new Set(documentLookup.keys()),
    [documentLookup]
  )
  const visibleRequirements = React.useMemo(
    () =>
      filterFiscalSponsorshipRequiredDocuments({
        connectedKeys,
        legalEntityType,
        showPostSignature: showGrantRequestSupport,
      }),
    [connectedKeys, legalEntityType, showGrantRequestSupport]
  )
  const grantRequestSupportHidden =
    !showGrantRequestSupport &&
    FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS.some(
      (requirement) =>
        requirement.stage === "post_signature" &&
        !documentLookup.has(requirement.key)
    )
  const legalEntityTypeNeeded =
    applicationReady && !legalEntityType && visibleRequirements.length > 0

  function handleFileChange({
    file,
    key,
  }: {
    file: File | null
    key: FiscalSponsorshipDocumentKey
  }) {
    setFilesByKey((current) => ({
      ...current,
      [key]: file ?? undefined,
    }))
  }

  function handleUpload({
    description,
    key,
    label,
  }: {
    description: string
    key: FiscalSponsorshipDocumentKey
    label: string
  }) {
    if (!applicationReady) {
      toast.error("Save the fiscal application before uploading requirements.")
      return
    }

    const file = filesByKey[key]
    if (!file) {
      toast.error("Choose a file to upload.")
      return
    }
    setPendingUpload({ key, label })
    startTransition(async () => {
      const toastId = toast.loading(`Uploading ${label.toLowerCase()}…`)

      try {
        const asset = await uploadFiscalSponsorshipProjectAsset({
          description,
          file,
          projectId,
          title: file.name,
        })
        const connected = await connectFiscalSponsorshipDocumentAsset({
          assetId: asset.assetId,
          documentKey: key,
          projectId,
          title: asset.assetName || file.name,
        })

        if ("error" in connected) {
          toast.error(connected.error, { id: toastId })
          return
        }

        setFilesByKey((current) => ({
          ...current,
          [key]: undefined,
        }))
        toast.success("Fiscal document uploaded", { id: toastId })
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to upload that fiscal document.",
          { id: toastId }
        )
      } finally {
        setPendingUpload(null)
      }
    })
  }

  return (
    <section
      data-fiscal-sponsorship-user-required-documents=""
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold">Required uploads</p>
        <p className="text-muted-foreground text-xs leading-snug">
          Upload each handbook requirement here. Files save to project assets
          and connect to Coach House review automatically.
        </p>
      </div>

      {!applicationReady ? (
        <Alert>
          <FileUpIcon aria-hidden />
          <AlertTitle>Save the application first</AlertTitle>
          <AlertDescription>
            Required uploads attach to a saved fiscal sponsorship application.
            Save a draft, then return here to upload the supporting documents.
          </AlertDescription>
          {onOpenApplication ? (
            <Button
              type="button"
              size="sm"
              className="mt-3 w-fit rounded-full"
              onClick={onOpenApplication}
            >
              Open application
            </Button>
          ) : null}
        </Alert>
      ) : null}

      {applicationReady && grantRequestSupportHidden ? (
        <Alert>
          <FileUpIcon aria-hidden />
          <AlertTitle>Grant requests and reports come after signing</AlertTitle>
          <AlertDescription>
            Invoices, payment details, intended use, timeframe, and
            certification support unlock after the agreement is signed. Reports
            and closeout documents follow the same project-file path.
          </AlertDescription>
        </Alert>
      ) : null}

      {legalEntityTypeNeeded ? (
        <Alert>
          <FileUpIcon aria-hidden />
          <AlertTitle>Choose the legal structure first</AlertTitle>
          <AlertDescription>
            Entity-specific uploads stay hidden until the application says
            whether this is an individual, LLC, corporation, partnership, or
            informal group.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="divide-border/70 divide-y divide-dashed">
        {visibleRequirements.map((requirement) => {
          const document = documentLookup.get(requirement.key) ?? null
          const isW9 = requirement.key === "tax_id_confirmation"
          const connected = Boolean(document)
          const uploadAllowed =
            applicationReady && shouldShowUploadAction(document)
          const pendingForRow =
            isPending && pendingUpload?.key === requirement.key
          const selectedFile = filesByKey[requirement.key] ?? null
          const inputId = `fiscal-required-${requirement.key}`
          const RowIcon = connected ? CheckCircle2Icon : CircleDashedIcon

          return (
            <div
              key={requirement.key}
              data-fiscal-sponsorship-user-required-document={requirement.key}
              className="flex min-w-0 flex-col gap-2 py-3"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <RowIcon
                  className={cn(
                    "mt-1 size-4 shrink-0",
                    connected ? "text-emerald-600" : "text-amber-600"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="text-foreground text-xs font-medium">
                      {requirement.label}
                    </p>
                    <RequiredDocumentReviewBadge document={document} />
                  </div>
                  <p className="text-muted-foreground mt-0.5 min-w-0 text-[11px] leading-snug [overflow-wrap:anywhere] break-words">
                    {document?.title || requirement.description}
                  </p>
                </div>
              </div>

              {document ? (
                <div className="pl-6">
                  <RequirementDocumentLinks document={document} />
                </div>
              ) : null}

              {isW9 && canCompleteW9 ? (
                <div className="pl-6">
                  <Button
                    asChild
                    type="button"
                    size="sm"
                    className="w-fit rounded-full"
                  >
                    <a href={`/fiscal-sponsorship/w9/${projectId}`}>
                      <FileSignatureIcon data-icon="inline-start" aria-hidden />
                      {document ? "Complete new W-9" : "Complete W-9"}
                    </a>
                  </Button>
                </div>
              ) : null}

              {uploadAllowed ? (
                <div className="grid min-w-0 gap-2 pl-6">
                  <Field className="min-w-0">
                    <FieldLabel htmlFor={inputId} className="text-xs">
                      {getUploadLabel({ document })}
                    </FieldLabel>
                    <Input
                      id={inputId}
                      name={requirement.key}
                      type="file"
                      className="h-9"
                      onChange={(event) =>
                        handleFileChange({
                          file: event.target.files?.[0] ?? null,
                          key: requirement.key,
                        })
                      }
                    />
                    <FieldDescription className="min-w-0 text-[11px] [overflow-wrap:anywhere] break-words">
                      {selectedFile
                        ? `${selectedFile.name} selected`
                        : "PDFs, images, spreadsheets, and document files are supported."}
                    </FieldDescription>
                  </Field>
                  <Button
                    type="button"
                    size="sm"
                    className="w-fit rounded-full"
                    disabled={!selectedFile || pendingForRow}
                    aria-busy={pendingForRow}
                    onClick={() =>
                      handleUpload({
                        description: requirement.description,
                        key: requirement.key,
                        label: requirement.label,
                      })
                    }
                  >
                    {pendingForRow ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <FileUpIcon data-icon="inline-start" aria-hidden />
                    )}
                    {getUploadLabel({ document })}
                  </Button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
