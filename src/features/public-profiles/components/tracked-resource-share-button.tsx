"use client"

import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import ShareIcon from "lucide-react/dist/esm/icons/share"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

async function shareOrCopy(input: { title: string; url: string }) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(input)
      toast.success("Link ready to share")
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
    }
  }

  await navigator.clipboard.writeText(input.url)
  toast.success("Link copied to clipboard")
}

export function TrackedResourceShareButton({
  className,
  resourceId,
  resourceTitle,
}: {
  className?: string
  resourceId: string
  resourceTitle: string
}) {
  const [busy, setBusy] = useState(false)

  async function handleShare() {
    if (busy) return
    setBusy(true)
    try {
      const response = await fetch("/api/account/public-share-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resourceId }),
      })
      const result = (await response.json()) as {
        error?: string
        resourceTitle?: string
        sharePath?: string
      }

      if (response.status === 401) {
        await shareOrCopy({ title: resourceTitle, url: window.location.href })
        return
      }
      if (!response.ok || !result.sharePath) {
        throw new Error(result.error ?? "Unable to create a tracked link.")
      }

      await shareOrCopy({
        title: result.resourceTitle ?? resourceTitle,
        url: new URL(result.sharePath, window.location.origin).toString(),
      })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to share this resource."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={busy}
      className={cn(className)}
      aria-label="Share resource"
      onClick={handleShare}
    >
      {busy ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
      ) : (
        <ShareIcon className="size-4" aria-hidden />
      )}
    </Button>
  )
}
