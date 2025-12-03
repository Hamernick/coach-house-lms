"use client"

import { useState } from "react"
import { toast } from "@/lib/toast"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import Image from "next/image"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

type OrgProfileHeaderProps = {
  name: string
  tagline: string
  logoUrl: string
  editMode: boolean
  isSaving: boolean
  canEdit: boolean
  publicLink?: string | null
  onLogoChange: (url: string) => void
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
  editMode,
  isSaving,
  canEdit,
  publicLink,
  onLogoChange,
  onSetDirty,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: OrgProfileHeaderProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  return (
    <>
      <div className="relative h-36 w-full overflow-hidden rounded-b-xl border-b bg-background">
        <GridPattern
          patternId="org-profile-header-pattern"
          squares={headerSquares}
          className="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-70 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)]"
        />
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
                onChange={async (event) => {
                  const file = event.currentTarget.files?.[0]
                  if (!file) return
                  const fd = new FormData()
                  fd.append("file", file)
                  setIsUploadingLogo(true)
                  const toastId = toast.loading("Uploading image…")
                  try {
                    const res = await fetch(`/api/account/org-media?kind=logo`, { method: "POST", body: fd })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err?.error || "Upload failed")
                    }
                    const { url } = await res.json()
                    onLogoChange(url)
                    onSetDirty()
                    toast.success("Image uploaded", { id: toastId })
                  } catch (error: unknown) {
                    toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
                  } finally {
                    setIsUploadingLogo(false)
                  }
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
