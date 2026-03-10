"use client"

import Cropper from "react-easy-crop"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

type AvatarCropDialogProps = {
  open: boolean
  rawImageUrl: string | null
  crop: { x: number; y: number }
  zoom: number
  onOpenChange: (open: boolean) => void
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (area: CropArea) => void
  onApply: () => Promise<void>
}

export function AvatarCropDialog({
  open,
  rawImageUrl,
  crop,
  zoom,
  onOpenChange,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onApply,
}: AvatarCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(720px,92%)] overflow-hidden rounded-2xl p-0 sm:p-0">
        <div className="space-y-0">
          <div className="border-b px-6 py-4">
            <DialogTitle asChild>
              <h3 className="text-lg font-semibold">Adjust your photo</h3>
            </DialogTitle>
            <DialogDescription asChild>
              <p className="text-muted-foreground mt-1 text-sm">
                Zoom and position the image, then apply.
              </p>
            </DialogDescription>
          </div>
          <div className="relative h-[320px] w-full bg-black/5">
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
              onChange={(event) => {
                onZoomChange(Number(event.currentTarget.value))
              }}
              className="accent-primary h-1 w-40"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void onApply()
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
