"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Share from "lucide-react/dist/esm/icons/share"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import { toast } from "@/lib/toast"

export function ShareButton({ url, title = "Share", icon = "default" }: { url?: string; title?: string; icon?: "default" | "link" }) {
  const [busy, setBusy] = useState(false)

  async function handleShare() {
    const target = url || (typeof window !== "undefined" ? window.location.href : "")
    if (!target) return
    try {
      setBusy(true)
      if (typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function") {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title, url: target })
        toast.success("Link ready to share")
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(target)
        toast.success("Link copied to clipboard")
      }
    } catch {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(target)
          toast.success("Link copied to clipboard")
        }
      } catch {}
    } finally {
      setBusy(false)
    }
  }

  const Icon = icon === "link" ? ExternalLink : Share

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleShare} disabled={busy} className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4" /> Share
    </Button>
  )
}
