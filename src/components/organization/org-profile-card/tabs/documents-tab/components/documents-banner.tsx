"use client"

import FolderOpen from "lucide-react/dist/esm/icons/folder-open"
import Lock from "lucide-react/dist/esm/icons/lock"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"

type DocumentsBannerProps = {
  hasRoadmapDocuments: boolean
  canEdit: boolean
  onDismiss: () => void
}

export function DocumentsBanner({
  hasRoadmapDocuments,
  canEdit,
  onDismiss,
}: DocumentsBannerProps) {
  return (
    <section className="rounded-2xl border border-border/70 bg-zinc-100/80 px-4 py-4 dark:bg-zinc-900/30 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
              <FolderOpen className="h-5 w-5" aria-hidden />
            </span>
            <h2
              id="documents-title"
              className="text-balance text-xl font-semibold text-foreground sm:text-2xl"
            >
              Store, track, and act on every key document in one place.
            </h2>
          </div>
          <div className="mt-3 max-w-[68ch] space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              {hasRoadmapDocuments
                ? "This filing system combines roadmap sections, policies, and organization files in one index so your team can find what matters and keep documentation current."
                : "Keep your organization's policies and core files in one secure index so your team can quickly find, update, and manage required documents."}
            </p>
            <p>Uploads support PDF files up to 15 MB.</p>
          </div>
          {!canEdit ? (
            <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-md border border-border/70 bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              You have view-only access. Organization admins can upload files and
              manage policies.
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg border border-border/70 bg-background/80 hover:bg-background"
          onClick={onDismiss}
          aria-label="Dismiss documents banner"
        >
          <XIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </section>
  )
}
