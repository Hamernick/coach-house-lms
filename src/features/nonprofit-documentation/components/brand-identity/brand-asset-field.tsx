"use client"

import Image from "next/image"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import UploadIcon from "lucide-react/dist/esm/icons/upload"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type { BrandAssetId, StoredBrandAsset } from "../../types"
import { downloadBlob } from "../../lib/brand-identity-export"

export function BrandAssetField({
  id,
  label,
  guidance,
  asset,
  previewUrl,
  onUpload,
  onDelete,
  aspect = "wide",
}: {
  id: BrandAssetId
  label: string
  guidance: string
  asset?: StoredBrandAsset
  previewUrl?: string
  onUpload: (id: BrandAssetId, file: File) => Promise<boolean>
  onDelete: (id: BrandAssetId) => Promise<void>
  aspect?: "wide" | "square"
}) {
  const inputId = `asset-${id}`

  return (
    <div>
      <div
        className={cn(
          "bg-muted/45 relative overflow-hidden rounded-md border",
          aspect === "square" ? "aspect-square" : "aspect-[16/9]"
        )}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${label} preview`}
            fill
            sizes={aspect === "square" ? "320px" : "720px"}
            className="object-contain p-8"
            unoptimized
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center px-6 text-center">
            <UploadIcon className="text-muted-foreground size-5" aria-hidden />
            <p className="mt-3 text-sm font-medium">
              Add {label.toLowerCase()}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              PNG, JPG, WebP, or SVG up to 12 MB
            </p>
          </div>
        )}
        {asset ? (
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={`Download ${label.toLowerCase()}`}
              onClick={() => downloadBlob(asset.blob, asset.name)}
            >
              <DownloadIcon aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={() => void onDelete(id)}
            >
              <Trash2Icon aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {guidance}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Label htmlFor={inputId} className="cursor-pointer">
            {asset ? "Replace" : "Upload"}
          </Label>
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onUpload(id, file)
            event.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
