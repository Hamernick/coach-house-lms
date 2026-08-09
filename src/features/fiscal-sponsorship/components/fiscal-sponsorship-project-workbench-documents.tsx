"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileCheck2Icon from "lucide-react/dist/esm/icons/file-check-2"
import FileSignatureIcon from "lucide-react/dist/esm/icons/file-signature"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type {
  FiscalSponsorshipProjectWorkbenchDocumentAction,
  FiscalSponsorshipProjectWorkbenchSigningAction,
} from "../types"

type FiscalSponsorshipProjectWorkbenchDocumentsProps = {
  documents: FiscalSponsorshipProjectWorkbenchDocumentAction[]
  signingActions: FiscalSponsorshipProjectWorkbenchSigningAction[]
}

function WorkbenchActionButton({
  children,
  disabled,
  href,
}: {
  children: ReactNode
  disabled?: boolean
  href?: string | null
}) {
  if (!href || disabled) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3"
        disabled
      >
        {children}
      </Button>
    )
  }

  if (href.startsWith("/fiscal-sponsorship/")) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-8 rounded-full px-3"
      >
        <Link href={href}>{children}</Link>
      </Button>
    )
  }

  return (
    <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-3">
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    </Button>
  )
}

function WorkbenchDocumentRow({
  action,
}: {
  action: FiscalSponsorshipProjectWorkbenchDocumentAction
}) {
  const available = Boolean(action.viewHref || action.downloadHref)

  return (
    <div className="flex min-w-0 flex-col gap-2 py-2 sm:flex-row sm:items-start sm:gap-2.5">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <FileCheck2Icon
          className={cn(
            "mt-1 size-4 shrink-0",
            available ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-foreground truncate text-xs font-medium">
              {action.title}
            </p>
            <Badge className="h-6 rounded-full border-transparent bg-amber-500/12 px-2 py-0.5 text-[11px] leading-none text-amber-700">
              {action.statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug">
            {action.description}
          </p>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <WorkbenchActionButton href={action.viewHref} disabled={!available}>
          <ExternalLinkIcon data-icon="inline-start" aria-hidden />
          View
        </WorkbenchActionButton>
        <WorkbenchActionButton href={action.downloadHref} disabled={!available}>
          <DownloadIcon data-icon="inline-start" aria-hidden />
          Download
        </WorkbenchActionButton>
      </div>
    </div>
  )
}

function WorkbenchSigningRow({
  action,
}: {
  action: FiscalSponsorshipProjectWorkbenchSigningAction
}) {
  const available = Boolean(action.href)

  return (
    <div className="flex min-w-0 flex-col gap-2 py-2 sm:flex-row sm:items-start sm:gap-2.5">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <FileSignatureIcon
          className={cn(
            "mt-1 size-4 shrink-0",
            available ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-foreground truncate text-xs font-medium">
              {action.title}
            </p>
            <Badge className="h-6 rounded-full border-transparent bg-amber-500/12 px-2 py-0.5 text-[11px] leading-none text-amber-700">
              {action.statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px] leading-snug">
            {action.description}
          </p>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <WorkbenchActionButton href={action.href} disabled={!available}>
          <ExternalLinkIcon data-icon="inline-start" aria-hidden />
          {action.actionLabel}
        </WorkbenchActionButton>
      </div>
    </div>
  )
}

export function FiscalSponsorshipProjectWorkbenchDocuments({
  documents,
  signingActions,
}: FiscalSponsorshipProjectWorkbenchDocumentsProps) {
  return (
    <section
      id="fiscal-sponsorship-documents"
      data-fiscal-sponsorship-project-workbench-documents=""
      className="min-w-0"
    >
      <div>
        <p className="text-sm font-semibold">Documents and signing</p>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          Sign securely in Coach House, then view or download the stored final
          files.
        </p>
      </div>
      <div className="divide-border/70 mt-2 divide-y divide-dashed">
        {signingActions.map((action) => (
          <WorkbenchSigningRow key={action.id} action={action} />
        ))}
        {documents.map((action) => (
          <WorkbenchDocumentRow key={action.id} action={action} />
        ))}
      </div>
    </section>
  )
}
