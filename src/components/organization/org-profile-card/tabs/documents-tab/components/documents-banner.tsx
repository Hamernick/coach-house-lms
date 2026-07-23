"use client"

import FolderOpen from "lucide-react/dist/esm/icons/folder-open"
import Lock from "lucide-react/dist/esm/icons/lock"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"

const DOCUMENTS_BANNER_SOURCE =
  "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-banner.tsx"

const DOCUMENTS_BANNER_OWNER_PROPS = getReactGrabOwnerProps({
  ownerId: "organization-documents:banner",
  component: "DocumentsBanner",
  source: DOCUMENTS_BANNER_SOURCE,
  slot: "root",
  canonicalOwnerSource: DOCUMENTS_BANNER_SOURCE,
  canonicalOwnerReason:
    "DocumentsBanner owns its document-introduction layout and presentation.",
})

type DocumentsBannerProps = {
  hasRoadmapDocuments: boolean
  canEdit: boolean
}

export function DocumentsBanner({
  hasRoadmapDocuments,
  canEdit,
}: DocumentsBannerProps) {
  return (
    <section
      {...DOCUMENTS_BANNER_OWNER_PROPS}
      className="border-border/70 rounded-2xl border bg-zinc-100/80 px-4 py-5 text-center sm:px-5 sm:py-6 dark:bg-zinc-900/30"
    >
      <div className="mx-auto flex max-w-[68ch] min-w-0 flex-col items-center">
        <span className="border-border/70 bg-background text-muted-foreground inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-xs">
          <FolderOpen className="size-6" aria-hidden />
        </span>
        <h2
          id="documents-title"
          className="text-foreground mt-3 max-w-[30ch] text-xl font-semibold text-balance sm:text-2xl"
        >
          Store, track, and act on every key document in one place.
        </h2>
        <div className="text-muted-foreground mt-3 space-y-2 text-sm leading-relaxed">
          <p>
            {hasRoadmapDocuments
              ? "This filing system combines roadmap sections, policies, and organization files in one index so your team can find what matters and keep documentation current."
              : "Keep your organization's policies and core files in one secure index so your team can quickly find, update, and manage required documents."}
          </p>
          <p>Uploads support PDF files up to 50 MB.</p>
        </div>
        {!canEdit ? (
          <div className="border-border/70 bg-background/70 text-muted-foreground mt-3 inline-flex w-fit items-center justify-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            You have view-only access. Organization admins can upload files and
            manage policies.
          </div>
        ) : null}
      </div>
    </section>
  )
}
