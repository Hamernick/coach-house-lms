"use client"

import FileIcon from "lucide-react/dist/esm/icons/file"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import LinkIcon from "lucide-react/dist/esm/icons/link"
import VideoIcon from "lucide-react/dist/esm/icons/video"
import XIcon from "lucide-react/dist/esm/icons/x"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type {
  FinancePlanResponseAttachmentKind,
  FinancePlanResponseLink,
} from "@/lib/prototype-lab/finance-plan-response"

function PreviewIcon({
  kind,
}: {
  kind: FinancePlanResponseAttachmentKind | "link"
}) {
  const Icon =
    kind === "image"
      ? ImageIcon
      : kind === "video"
        ? VideoIcon
        : kind === "document"
          ? FileIcon
          : LinkIcon
  return <Icon aria-hidden="true" className="size-4 shrink-0" />
}

function DraftFilePreview({ file }: { file: File }) {
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setSource(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSource(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!source) {
    return (
      <PreviewIcon
        kind={file.type.startsWith("video/") ? "video" : "document"}
      />
    )
  }

  return (
    <Image
      alt=""
      className="size-7 rounded-full object-cover"
      height={28}
      src={source}
      unoptimized
      width={28}
    />
  )
}

export function FinancePlanResponseDraftPreviews({
  files,
  links,
  onRemoveFile,
}: {
  files: File[]
  links: FinancePlanResponseLink[]
  onRemoveFile: (index: number) => void
}) {
  if (!files.length && !links.length) return null

  return (
    <div className="nowheel flex max-w-full gap-2 overflow-x-auto px-1 pb-2">
      {files.map((file, index) => (
        <div
          className="border-border/70 bg-background flex h-10 max-w-56 shrink-0 items-center gap-2 rounded-full border py-1 pr-1 pl-2"
          key={`${file.name}:${file.size}:${file.lastModified}`}
        >
          <DraftFilePreview file={file} />
          <span className="truncate text-xs">{file.name}</span>
          <Button
            aria-label={`Remove ${file.name}`}
            className="size-8 rounded-full"
            onClick={() => onRemoveFile(index)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      ))}

      {links.map((link) => (
        <a
          className="border-border/70 bg-background hover:bg-accent flex h-10 max-w-64 shrink-0 items-center gap-2 rounded-full border px-3 text-xs transition-colors"
          href={link.href}
          key={link.href}
          rel="noreferrer"
          target="_blank"
        >
          <PreviewIcon kind={link.kind} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{link.host}</span>
            <span className="text-muted-foreground block truncate">
              {link.kind === "link" ? "Link" : link.kind}
            </span>
          </span>
        </a>
      ))}
    </div>
  )
}
