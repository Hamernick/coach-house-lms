import { Download, ExternalLink, FileCheck2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  FiscalSponsorshipProjectWorkflowSummary,
  FiscalSponsorshipProjectWorkflowSummaryDocument,
} from "@/features/fiscal-sponsorship"

type MemberWorkspaceProjectFiscalDocumentsProps = {
  workflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
}

export function getMemberWorkspaceProjectFiscalDocuments(
  workflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
) {
  return [
    workflowSummary?.latestExecutedAgreementDocument ?? null,
    workflowSummary?.latestAuditCertificateDocument ?? null,
  ].filter(
    (document): document is FiscalSponsorshipProjectWorkflowSummaryDocument =>
      document?.status === "executed" &&
      Boolean(document.viewHref || document.downloadHref)
  )
}

export function getMemberWorkspaceProjectFiscalDocumentAssetIds(
  workflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
) {
  return new Set(
    getMemberWorkspaceProjectFiscalDocuments(workflowSummary)
      .map((document) => document.assetId)
      .filter((assetId): assetId is string => Boolean(assetId))
  )
}

function getDocumentKindLabel(
  document: FiscalSponsorshipProjectWorkflowSummaryDocument
) {
  return document.kind === "audit_certificate"
    ? "Execution certificate"
    : "Executed agreement"
}

export function MemberWorkspaceProjectFiscalDocuments({
  workflowSummary,
}: MemberWorkspaceProjectFiscalDocumentsProps) {
  const documents = getMemberWorkspaceProjectFiscalDocuments(workflowSummary)

  if (documents.length === 0) return null

  return (
    <section
      className="space-y-4"
      data-member-workspace-project-fiscal-documents
    >
      <div className="space-y-1">
        <h2 className="text-foreground text-sm font-semibold">
          Signed fiscal sponsorship documents
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          Final agreements and execution certificates are read-only.
        </p>
      </div>

      <ul className="border-border bg-card divide-y overflow-hidden rounded-xl border">
        {documents.map((document) => (
          <li
            className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            key={document.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                <FileCheck2 aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">
                  {document.title}
                </p>
                <p className="text-muted-foreground text-sm">
                  {getDocumentKindLabel(document)} · Version {document.version}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {document.viewHref ? (
                <Button
                  asChild
                  className="min-h-11 sm:min-h-9"
                  size="sm"
                  variant="outline"
                >
                  <a href={document.viewHref} rel="noreferrer" target="_blank">
                    <ExternalLink aria-hidden="true" className="size-4" />
                    Open
                  </a>
                </Button>
              ) : null}
              {document.downloadHref ? (
                <Button
                  asChild
                  className="min-h-11 sm:min-h-9"
                  size="sm"
                  variant="ghost"
                >
                  <a href={document.downloadHref}>
                    <Download aria-hidden="true" className="size-4" />
                    Download
                  </a>
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
