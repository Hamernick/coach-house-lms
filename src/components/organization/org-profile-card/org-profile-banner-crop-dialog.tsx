"use client"

import Cropper from "react-easy-crop"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import {
  ORG_BANNER_ASPECT_LABEL,
  ORG_BANNER_ASPECT_RATIO,
  ORG_BANNER_MIN_DIMENSIONS_LABEL,
  ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL,
} from "@/lib/organization/banner-spec"

import type { CropArea } from "./banner-image-utils"

type OrgProfileBannerCropDialogProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  rawImageUrl: string | null
  crop: { x: number; y: number }
  onCropChange: (next: { x: number; y: number }) => void
  zoom: number
  onZoomChange: (next: number) => void
  onCropComplete: (area: CropArea) => void
  isUploadingBanner: boolean
  onApply: () => Promise<void>
}

export function OrgProfileBannerCropDialog({
  open,
  onOpenChange,
  rawImageUrl,
  crop,
  onCropChange,
  zoom,
  onZoomChange,
  onCropComplete,
  isUploadingBanner,
  onApply,
}: OrgProfileBannerCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(920px,96vw)] rounded-2xl p-0 sm:max-w-[920px] sm:p-0">
        <div className="space-y-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Adjust your organization banner</DialogTitle>
            <DialogDescription>
              Use a wide image. Recommended {ORG_BANNER_RECOMMENDED_DIMENSIONS_LABEL}px ({ORG_BANNER_ASPECT_LABEL}),
              minimum {ORG_BANNER_MIN_DIMENSIONS_LABEL}px. We preserve a high-resolution crop so uploaded detail stays sharp.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="border-b lg:border-b-0 lg:border-r">
              <div className="relative mx-4 my-4 overflow-hidden rounded-xl border border-border/60 bg-muted/30 lg:mx-6 lg:my-6">
                <div className="relative aspect-[4/1] w-full min-h-[220px]">
                  {rawImageUrl ? (
                    <Cropper
                      image={rawImageUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={ORG_BANNER_ASPECT_RATIO}
                      showGrid={false}
                      objectFit="cover"
                      onCropChange={onCropChange}
                      onZoomChange={onZoomChange}
                      onCropComplete={(_, area) => onCropComplete(area)}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4 lg:px-5 lg:py-6">
              <div className="space-y-1">
                <p className="text-sm font-medium">Banner guidance</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Use a wide image with a clear focal point near the center.</li>
                  <li>Avoid text near the top-right corner where UI actions may overlay.</li>
                  <li>Keep important subjects away from the extreme edges to prevent cropping.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-foreground" htmlFor="org-banner-zoom-slider">
                    Zoom
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <SearchIcon className="h-3 w-3" aria-hidden />
                    {zoom.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  id="org-banner-zoom-slider"
                  min={1}
                  max={3}
                  step={0.05}
                  value={[zoom]}
                  onValueChange={(next) => onZoomChange(next[0] ?? 1)}
                  className="w-full"
                />
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                Keep the crop at least {ORG_BANNER_MIN_DIMENSIONS_LABEL}px for best clarity.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-xs text-muted-foreground">Preview and adjust before uploading.</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isUploadingBanner} aria-busy={isUploadingBanner} onClick={onApply}>
                {isUploadingBanner ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Applying…
                  </span>
                ) : (
                  "Apply banner"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
