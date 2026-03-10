"use client"

import Cropper from "react-easy-crop"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { type CropArea } from "./account-settings-image-utils"

type AccountSettingsAvatarCropDialogProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  rawImageUrl: string | null
  crop: { x: number; y: number }
  onCropChange: (next: { x: number; y: number }) => void
  zoom: number
  onZoomChange: (next: number) => void
  onCropComplete: (area: CropArea) => void
  isUploadingAvatar: boolean
  onApply: () => Promise<void>
}

export function AccountSettingsAvatarCropDialog({
  open,
  onOpenChange,
  rawImageUrl,
  crop,
  onCropChange,
  zoom,
  onZoomChange,
  onCropComplete,
  isUploadingAvatar,
  onApply,
}: AccountSettingsAvatarCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(720px,92%)] rounded-2xl p-0 sm:p-0">
        <div className="space-y-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Adjust your profile picture</DialogTitle>
            <DialogDescription>Zoom and position the image, then apply.</DialogDescription>
          </DialogHeader>
          <div className="relative h-[320px] w-full">
            {rawImageUrl ? (
              <Cropper
                image={rawImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={(_, area) => onCropComplete(area)}
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t px-6 py-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.currentTarget.value))}
              className="h-1 w-40 accent-primary"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isUploadingAvatar} aria-busy={isUploadingAvatar} onClick={onApply}>
                {isUploadingAvatar ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Applying…
                  </span>
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
