"use client"

import { useState } from "react"
import Image from "next/image"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Button } from "@/components/ui/button"
import {
  uploadOrgMedia,
  validateOrgMediaFile,
  type OrgMediaKind,
} from "@/lib/organization/org-media"
import { toast } from "@/lib/toast"

import type { WorkspaceBrandKitProfileEditorProps } from "./workspace-brand-kit-profile-editor-types"

type AssetField = {
  field: "logoUrl" | "brandMarkUrl"
  kind: OrgMediaKind
  title: string
  helper: string
}

const ASSET_FIELDS: AssetField[] = [
  {
    field: "logoUrl",
    kind: "logo",
    title: "Primary",
    helper: "Use the full logo for profiles, headers, and formal materials.",
  },
  {
    field: "brandMarkUrl",
    kind: "logo-mark",
    title: "Mark",
    helper: "Use a compact symbol or monogram for small spaces.",
  },
]

function AssetCard({
  asset,
  src,
  pending,
  onSelect,
}: {
  asset: AssetField
  src: string
  pending: boolean
  onSelect: (file: File) => void
}) {
  const inputId = `brand-kit-${asset.field}`

  return (
    <div className="border-border/60 bg-muted/20 grid gap-3 rounded-xl border p-3">
      <div className="border-border/60 bg-background relative flex h-28 items-center justify-center overflow-hidden rounded-lg border">
        {src ? (
          <Image
            src={src}
            alt={`${asset.title} brand asset`}
            fill
            sizes="320px"
            className="object-contain p-4"
          />
        ) : (
          <span className="text-muted-foreground text-sm">
            {asset.title} logo
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-foreground text-sm font-medium">{asset.title}</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed text-pretty">
          {asset.helper}
        </p>
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        disabled={pending}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onSelect(file)
          event.currentTarget.value = ""
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        asChild
        disabled={pending}
      >
        <label htmlFor={inputId} className="cursor-pointer">
          {pending ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          {pending ? "Uploading..." : src ? "Replace logo" : "Upload logo"}
        </label>
      </Button>
    </div>
  )
}

export function WorkspaceBrandKitProfileAssets({
  profile,
  onAutoSave,
}: Pick<WorkspaceBrandKitProfileEditorProps, "profile" | "onAutoSave">) {
  const [pendingField, setPendingField] = useState<AssetField["field"] | null>(
    null
  )

  const handleUpload = async (asset: AssetField, file: File) => {
    const validationError = validateOrgMediaFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const toastId = toast.loading(
      `Uploading ${asset.title.toLowerCase()} logo...`
    )
    setPendingField(asset.field)
    try {
      const url = await uploadOrgMedia({ file, kind: asset.kind })
      await onAutoSave({ [asset.field]: url })
      toast.success(`${asset.title} logo saved`, { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      })
    } finally {
      setPendingField(null)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-foreground text-sm font-semibold text-balance">
          Logos
        </h4>
        <p className="text-muted-foreground mt-1 text-xs text-pretty">
          Upload a full logo and a compact mark. Files save immediately.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ASSET_FIELDS.map((asset) => (
          <AssetCard
            key={asset.field}
            asset={asset}
            src={profile[asset.field]?.trim() ?? ""}
            pending={pendingField === asset.field}
            onSelect={(file) => void handleUpload(asset, file)}
          />
        ))}
      </div>
    </section>
  )
}
