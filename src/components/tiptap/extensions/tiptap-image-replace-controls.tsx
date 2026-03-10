"use client"

import type { ChangeEvent, RefObject } from "react"
import { ImageIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type TiptapImageReplaceControlsProps = {
  fileInputRef: RefObject<HTMLInputElement | null>
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  error: string | null | undefined
  imageUrl: string
  setImageUrl: (value: string) => void
  altText: string
  setAltText: (value: string) => void
  handleImageUrlSubmit: () => void
}

export function TiptapImageReplaceControls({
  fileInputRef,
  handleFileChange,
  uploading,
  error,
  imageUrl,
  setImageUrl,
  altText,
  setAltText,
  handleImageUrlSubmit,
}: TiptapImageReplaceControlsProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ImageIcon className="mr-2 size-4" /> Replace Image
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-2 w-fit min-w-52">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium">Upload Image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="replace-image-upload"
            />
            <label
              htmlFor="replace-image-upload"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 hover:bg-accent"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  <span>Choose Image</span>
                </>
              )}
            </label>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium">Or use URL</p>
            <div className="space-y-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL..."
                className="text-xs"
              />
              <Button
                type="button"
                onClick={handleImageUrlSubmit}
                className="w-full"
                disabled={!imageUrl}
                size="sm"
              >
                Replace with URL
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium">Alt Text</p>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt text (optional)"
              className="text-xs"
            />
          </div>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
