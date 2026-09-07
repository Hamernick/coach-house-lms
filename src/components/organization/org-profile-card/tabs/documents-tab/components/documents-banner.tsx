"use client"

import { useRef, useState, type DragEvent, type ReactNode } from "react"
import { IconCloudUpload, IconLock } from "@tabler/icons-react"

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
  editMode?: boolean
  uploading?: boolean
  onFilesDropped?: (files: File[]) => Promise<void>
  children: ReactNode
}

export function DocumentsBanner({
  canEdit,
  editMode = false,
  uploading = false,
  onFilesDropped,
  children,
}: DocumentsBannerProps) {
  const [draggingFiles, setDraggingFiles] = useState(false)
  const dragDepthRef = useRef(0)
  const acceptsDrops =
    canEdit && editMode && Boolean(onFilesDropped) && !uploading

  const hasFiles = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes("Files")

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!acceptsDrops || !hasFiles(event)) return
    event.preventDefault()
    dragDepthRef.current += 1
    setDraggingFiles(true)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!acceptsDrops || !hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!acceptsDrops || !hasFiles(event)) return
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDraggingFiles(false)
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!acceptsDrops || !hasFiles(event)) return
    event.preventDefault()
    dragDepthRef.current = 0
    setDraggingFiles(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) void onFilesDropped?.(files)
  }

  return (
    <section
      {...DOCUMENTS_BANNER_OWNER_PROPS}
      className="relative mx-auto w-full max-w-[42rem] rounded-[2rem] bg-transparent p-4"
      data-dragging-files={draggingFiles || undefined}
      aria-busy={uploading || undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {draggingFiles ? (
        <div className="bg-background/95 border-primary/60 absolute inset-1 z-50 flex flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed backdrop-blur-sm">
          <IconCloudUpload className="text-primary size-8" aria-hidden />
          <p className="mt-3 text-sm font-medium">Drop files to upload</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Up to 50 MB per file
          </p>
        </div>
      ) : null}
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
