"use client"

import { useEffect, useState } from "react"
import FileType2Icon from "lucide-react/dist/esm/icons/file-type-2"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Dropzone, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone"

import type { WorkspaceCardSize } from "./workspace-board-types"

type DeckAsset = {
  file: File
  objectUrl: string
}

const DECK_ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
} as const

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

export function WorkspaceBoardDeckCard({
  size,
  presentationMode,
}: {
  size: WorkspaceCardSize
  presentationMode: boolean
}) {
  const [asset, setAsset] = useState<DeckAsset | null>(null)

  useEffect(() => {
    return () => {
      if (asset?.objectUrl) {
        URL.revokeObjectURL(asset.objectUrl)
      }
    }
  }, [asset])

  const replaceAsset = (file: File) => {
    setAsset((previous) => {
      if (previous?.objectUrl) {
        URL.revokeObjectURL(previous.objectUrl)
      }
      return {
        file,
        objectUrl: URL.createObjectURL(file),
      }
    })
  }

  const clearAsset = () => {
    setAsset((previous) => {
      if (previous?.objectUrl) {
        URL.revokeObjectURL(previous.objectUrl)
      }
      return null
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="relative min-h-[180px] flex-1 overflow-hidden rounded-[14px] border border-border/60 bg-background/55">
        {asset ? (
          isPdfFile(asset.file) ? (
            <iframe
              title="Deck preview"
              src={asset.objectUrl}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center">
              <div className="space-y-1.5">
                <FileType2Icon className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
                <p className="line-clamp-1 text-sm font-medium">{asset.file.name}</p>
                <p className="text-xs text-muted-foreground">PPT preview keeps the file staged for fullscreen editor rendering.</p>
              </div>
            </div>
          )
        ) : (
          <div className="grid h-full place-items-center px-4 text-center">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Drop one deck file</p>
              <p className="text-xs text-muted-foreground">PDF, PPT, or PPTX</p>
            </div>
          </div>
        )}
      </div>

      <Dropzone
        src={asset ? [asset.file] : undefined}
        accept={DECK_ACCEPT}
        maxFiles={1}
        disabled={presentationMode}
        className="rounded-[12px] border border-dashed border-border/70 bg-background/55 px-3 py-2"
        onDrop={(acceptedFiles) => {
          const nextFile = acceptedFiles[0]
          if (!nextFile) return
          replaceAsset(nextFile)
        }}
      >
        <DropzoneEmptyState className="gap-1 text-center">
          <p className="text-xs font-medium">Drop or click to stage</p>
          <p className="text-[11px] text-muted-foreground">One file at a time</p>
        </DropzoneEmptyState>
      </Dropzone>

      {asset ? (
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="min-w-0 flex-1 truncate">{asset.file.name}</span>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={clearAsset}>
            <Trash2Icon className="h-3.5 w-3.5" aria-hidden />
            Clear
          </Button>
        </div>
      ) : null}

      {size === "md" ? (
        <p className="text-[11px] text-muted-foreground">Fullscreen uses the deck editor surface for focused review and iteration.</p>
      ) : null}
    </div>
  )
}
