import { DownloadSimple } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import type { ReactNode } from "react"

import type { QuickLink } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import { cn } from "@/features/platform-admin-dashboard/upstream/lib/utils"

type FileLinkRowProps = {
  file: QuickLink
  className?: string
  actions?: ReactNode
}

export function getFileIcon(type: QuickLink["type"]) {
  switch (type) {
    case "pdf":
      return { src: "/platform-lab/pdf.png", alt: "PDF" }
    case "zip":
      return { src: "/platform-lab/zip.png", alt: "ZIP" }
    case "fig":
      return { src: "/platform-lab/figma.png", alt: "Figma" }
    default:
      return { src: "/platform-lab/pdf.png", alt: "File" }
  }
}

export function FileLinkRow({ file, className, actions }: FileLinkRowProps) {
  const icon = getFileIcon(file.type)

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 rounded-lg flex items-center justify-center">
          <Image
            src={icon.src}
            alt={icon.alt}
            width={36}
            height={36}
            className="rounded"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
          <div className="text-sm text-muted-foreground">{file.sizeMB.toFixed(1)} MB</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          aria-label={`Download ${file.name}`}
          asChild
        >
          <a href={file.url} target="_blank" rel="noreferrer">
            <DownloadSimple className="h-4 w-4" />
          </a>
        </Button>
        {actions}
      </div>
    </div>
  )
}
