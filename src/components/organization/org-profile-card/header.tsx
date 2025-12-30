"use client"

import { useState } from "react"
import { toast } from "@/lib/toast"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import Image from "next/image"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import { cn } from "@/lib/utils"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"

type OrgProfileHeaderProps = {
  name: string
  tagline: string
  logoUrl: string
  headerUrl: string
  editMode: boolean
  isSaving: boolean
  canEdit: boolean
  publicLink?: string | null
  onLogoChange: (url: string) => void
  onHeaderChange: (url: string) => void
  onSetDirty: () => void
  onEnterEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
}

const headerSquares: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]

export function OrgProfileHeader({
  name,
  tagline,
  logoUrl,
  headerUrl,
  editMode,
  isSaving,
  canEdit,
  publicLink,
  onLogoChange,
  onHeaderChange,
  onSetDirty,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: OrgProfileHeaderProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingHeader, setIsUploadingHeader] = useState(false)

  const handleUpload = async (file: File, kind: "logo" | "header") => {
    const error = validateOrgMediaFile(file)
    if (error) {
      toast.error(error)
      return
    }

    const setUploading = kind === "logo" ? setIsUploadingLogo : setIsUploadingHeader
    setUploading(true)
    const toastId = toast.loading("Uploading image…")
    try {
      const url = await uploadOrgMedia({ file, kind })
      if (kind === "logo") {
        onLogoChange(url)
      } else {
        onHeaderChange(url)
      }
      onSetDirty()
      toast.success("Image uploaded", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="relative h-36 w-full overflow-hidden rounded-b-xl border-b bg-background">
        {headerUrl ? (
          <Image src={headerUrl} alt="" fill className="object-cover" sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/10 to-background/40" />
        <GridPattern
          patternId="org-profile-header-pattern"
          squares={headerSquares}
          className={cn(
            "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)]",
            headerUrl ? "opacity-40" : "opacity-70",
          )}
        />
        {canEdit && editMode ? (
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (!file) return
                  void handleUpload(file, "header")
                }}
              />
              <Button size="sm" variant="secondary" disabled={isUploadingHeader}>
                {isUploadingHeader ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Image…
                  </span>
                ) : headerUrl ? (
                  "Change header"
                ) : (
                  "Add header"
                )}
              </Button>
            </label>
          </div>
        ) : null}
      </div>

      <div className="relative p-6">
        <div className="absolute -top-12 left-6 flex items-center gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">LOGO</div>
            )}
          </div>
          {canEdit && editMode ? (
            <label className="inline-flex self-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (!file) return
                  void handleUpload(file, "logo")
                }}
              />
              <Button size="sm" variant="outline" disabled={isUploadingLogo}>
                {isUploadingLogo ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Image…
                  </span>
                ) : (
                  "Add image"
                )}
              </Button>
            </label>
          ) : null}
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">{name || "Organization"}</h2>
          <p className="text-sm text-muted-foreground">{tagline || "—"}</p>
        </div>

        <div className="absolute right-6 top-6 flex gap-2">
          {publicLink ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={publicLink}>View public page</Link>
            </Button>
          ) : null}
          {canEdit ? (
            editMode ? (
            <>
              <Button variant="ghost" onClick={onCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </>
            ) : (
              <Button onClick={onEnterEdit}>Edit</Button>
            )
          ) : null}
        </div>
      </div>
    </>
  )
}
