"use client"

import Link from "next/link"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import PencilLine from "lucide-react/dist/esm/icons/pencil-line"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ORG_BANNER_ASPECT_LABEL,
  ORG_BANNER_MIN_DIMENSIONS_LABEL,
  ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL,
} from "@/lib/organization/banner-spec"

type OrgProfileHeaderBannerControlsProps = {
  canEdit: boolean
  editMode: boolean
  headerInputId: string
  headerBusy: boolean
  hasHeader: boolean
  isUploadingHeader: boolean
  onCloseToWorkspace?: (() => void) | null
  onStartBannerUpload: (file: File) => void
  onAdjustHeader: () => void
  onRemoveHeader: () => void
}

export function OrgProfileHeaderBannerControls({
  canEdit,
  editMode,
  headerInputId,
  headerBusy,
  hasHeader,
  isUploadingHeader,
  onCloseToWorkspace,
  onStartBannerUpload,
  onAdjustHeader,
  onRemoveHeader,
}: OrgProfileHeaderBannerControlsProps) {
  if (!canEdit || !editMode) {
    if (!onCloseToWorkspace) return null
    return (
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full border border-border/70 bg-background/85 backdrop-blur-sm"
          onClick={onCloseToWorkspace}
          aria-label="Return to workspace"
        >
          <XIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {onCloseToWorkspace ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full border border-border/70 bg-background/85 backdrop-blur-sm"
            onClick={onCloseToWorkspace}
            aria-label="Return to workspace"
          >
            <XIcon className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
        <input
          id={headerInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (!file) return
            onStartBannerUpload(file)
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
              <DropdownMenuItem
                disabled={headerBusy}
                onSelect={() => onAdjustHeader()}
              >
                Adjust banner
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild disabled={headerBusy} className="cursor-pointer">
                <label htmlFor={headerInputId} className="flex w-full cursor-pointer items-center gap-2">
                  {isUploadingHeader ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                    </>
                  ) : (
                    "Replace banner"
                  )}
                </label>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="opacity-100">
                <span className="text-xs text-muted-foreground">
                  Banner: {ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL}px ({ORG_BANNER_ASPECT_LABEL})
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={headerBusy}
                onSelect={() => onRemoveHeader()}
              >
                Remove banner
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
                "Upload banner"
              )}
            </label>
          </Button>
        )}
      </div>
      <div className="absolute right-4 top-14 rounded-md border border-border/60 bg-background/85 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        Banner {ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL}px ({ORG_BANNER_ASPECT_LABEL}) recommended · min{" "}
        {ORG_BANNER_MIN_DIMENSIONS_LABEL}px
      </div>
    </>
  )
}

type OrgProfileHeaderLogoControlsProps = {
  canEdit: boolean
  editMode: boolean
  logoInputId: string
  logoBusy: boolean
  hasLogo: boolean
  isUploadingLogo: boolean
  onUploadLogo: (file: File) => void
  onRemoveLogo: () => void
}

export function OrgProfileHeaderLogoControls({
  canEdit,
  editMode,
  logoInputId,
  logoBusy,
  hasLogo,
  isUploadingLogo,
  onUploadLogo,
  onRemoveLogo,
}: OrgProfileHeaderLogoControlsProps) {
  if (!canEdit || !editMode) return null

  return (
    <div className="flex items-center">
      <input
        id={logoInputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (!file) return
          onUploadLogo(file)
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
              onSelect={() => onRemoveLogo()}
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
  )
}

type OrgProfileHeaderActionsProps = {
  publicLink?: string | null
  editMode: boolean
  canEdit: boolean
  isSaving: boolean
  isDirty: boolean
  onEnterEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
}

export function OrgProfileHeaderActions({
  publicLink,
  editMode,
  canEdit,
  isSaving,
  isDirty,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: OrgProfileHeaderActionsProps) {
  return (
    <div className="absolute right-6 top-6 flex gap-2">
      {publicLink && !editMode ? (
        <Button asChild size="sm" variant="secondary">
          <Link href={publicLink}>View map profile</Link>
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
          <Button size="sm" onClick={onEnterEdit} data-tour="org-profile-edit">
            Edit
          </Button>
        )
      ) : null}
    </div>
  )
}
