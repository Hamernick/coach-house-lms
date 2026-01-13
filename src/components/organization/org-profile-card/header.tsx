"use client"

import { useId, useState } from "react"
import { toast } from "@/lib/toast"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import Image from "next/image"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import PencilLine from "lucide-react/dist/esm/icons/pencil-line"
import { cn } from "@/lib/utils"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"

type OrgProfileHeaderProps = {
  name: string
  tagline: string
  logoUrl: string
  headerUrl: string
  editMode: boolean
  isSaving: boolean
  isDirty: boolean
  canEdit: boolean
  publicLink?: string | null
  onLogoChange: (url: string | null) => Promise<void>
  onHeaderChange: (url: string | null) => Promise<void>
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
  isDirty,
  canEdit,
  publicLink,
  onLogoChange,
  onHeaderChange,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: OrgProfileHeaderProps) {
  const logoInputId = useId()
  const headerInputId = useId()
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingHeader, setIsUploadingHeader] = useState(false)
  const [isRemovingLogo, setIsRemovingLogo] = useState(false)
  const [isRemovingHeader, setIsRemovingHeader] = useState(false)

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
        await onLogoChange(url)
      } else {
        await onHeaderChange(url)
      }
      toast.success("Image saved", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (kind: "logo" | "header") => {
    const setRemoving = kind === "logo" ? setIsRemovingLogo : setIsRemovingHeader
    setRemoving(true)
    const toastId = toast.loading("Removing image…")
    try {
      if (kind === "logo") {
        await onLogoChange(null)
      } else {
        await onHeaderChange(null)
      }
      toast.success("Image removed", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Remove failed", { id: toastId })
    } finally {
      setRemoving(false)
    }
  }

  const logoBusy = isUploadingLogo || isRemovingLogo || isSaving
  const headerBusy = isUploadingHeader || isRemovingHeader || isSaving
  const hasLogo = Boolean(logoUrl)
  const hasHeader = Boolean(headerUrl)

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
            <input
              id={headerInputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (!file) return
                void handleUpload(file, "header")
                event.currentTarget.value = ""
              }}
            />
            {hasHeader ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    disabled={headerBusy}
                    aria-label="Header image actions"
                  >
                    <PencilLine className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild disabled={headerBusy} className="cursor-pointer">
                    <label htmlFor={headerInputId} className="flex w-full cursor-pointer items-center gap-2">
                      {isUploadingHeader ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                        </>
                      ) : (
                        "Replace header"
                      )}
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={headerBusy}
                    onSelect={() => void handleRemove("header")}
                  >
                    Remove header
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="secondary" disabled={headerBusy}>
                <label htmlFor={headerInputId} className="cursor-pointer">
                  {isUploadingHeader ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                    </span>
                  ) : (
                    "Upload"
                  )}
                </label>
              </Button>
            )}
          </div>
        ) : null}
      </div>

	      <div className="relative bg-sidebar p-6">
        <div className="absolute -top-12 left-6">
          <div className="flex items-end gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="96px" />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">LOGO</div>
              )}
            </div>
            {canEdit && editMode ? (
              <div className="flex items-center">
                <input
                  id={logoInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (!file) return
                    void handleUpload(file, "logo")
                    event.currentTarget.value = ""
                  }}
                />
                {hasLogo ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={logoBusy}
                        aria-label="Logo image actions"
                      >
                        <PencilLine className="h-4 w-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild disabled={logoBusy} className="cursor-pointer">
                        <label htmlFor={logoInputId} className="flex w-full cursor-pointer items-center gap-2">
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                            </>
                          ) : (
                            "Replace logo"
                          )}
                        </label>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={logoBusy}
                        onSelect={() => void handleRemove("logo")}
                      >
                        Remove logo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild size="sm" variant="outline" disabled={logoBusy}>
                    <label htmlFor={logoInputId} className="cursor-pointer">
                      {isUploadingLogo ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                        </span>
                      ) : (
                        "Upload"
                      )}
                    </label>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className={cn("mt-14", editMode && canEdit && "mt-24")}>
          <h2 className="text-2xl font-semibold tracking-tight">{name || "Organization"}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{tagline || "—"}</p>
        </div>

        <div className="absolute right-6 top-6 flex gap-2">
          {publicLink && !editMode ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={publicLink}>View public page</Link>
            </Button>
          ) : null}
          {canEdit ? (
            editMode ? (
            <>
              <Button size="sm" variant="ghost" onClick={onCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </>
            ) : (
              <Button size="sm" onClick={onEnterEdit}>
                Edit
              </Button>
            )
          ) : null}
        </div>
      </div>
    </>
  )
}
