"use client"

import type { DragEvent, ReactNode } from "react"
import { IconLock } from "@tabler/icons-react"

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
    "DocumentsBanner owns the complete Documents library surface and presentation.",
})

type DocumentsBannerProps = {
  canEdit: boolean
  uploading?: boolean
  children: ReactNode
}

export function DocumentsBanner({
  canEdit,
  uploading = false,
  children,
}: DocumentsBannerProps) {
  const preventFileNavigation = (event: DragEvent<HTMLElement>) => {
    if (Array.from(event.dataTransfer.types).includes("Files")) {
      event.preventDefault()
      event.dataTransfer.dropEffect = "none"
    }
  }

  return (
    <section
      {...DOCUMENTS_BANNER_OWNER_PROPS}
      className="relative mx-auto w-full max-w-xl rounded-2xl bg-transparent p-3"
      aria-busy={uploading || undefined}
      onDragOver={preventFileNavigation}
      onDrop={preventFileNavigation}
    >
      {children}
      {!canEdit ? (
        <p className="text-muted-foreground mt-5 flex items-center gap-2 text-xs">
          <IconLock className="size-3.5" aria-hidden />
          View-only access. Organization admins can add and manage files.
        </p>
      ) : null}
    </section>
  )
}
