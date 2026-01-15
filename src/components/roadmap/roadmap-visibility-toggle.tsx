"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { EyeOff, ExternalLink } from "lucide-react"
import Link from "next/link"

import { setRoadmapPublicAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { publicSharingEnabled } from "@/lib/feature-flags"

export function RoadmapVisibilityToggle({
  initialPublic,
  publicSlug,
  canPublishPublicRoadmap = false,
  onPublicChange,
  showViewAction = true,
  className,
}: {
  initialPublic: boolean
  publicSlug: string | null
  canPublishPublicRoadmap?: boolean
  onPublicChange?: (next: boolean) => void
  showViewAction?: boolean
  className?: string
}) {
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [isPending, startTransition] = useTransition()
  const sharingEnabled = publicSharingEnabled

  const sharePath = useMemo(() => {
    if (!publicSlug || publicSlug.trim().length === 0) return null
    return `/${publicSlug}/roadmap`
  }, [publicSlug])

  const handleToggle = useCallback(
    (next: boolean) => {
      if (!canPublishPublicRoadmap) {
        toast.error("Upgrade to Organization to publish your roadmap")
        return
      }
      if (!sharePath) {
        toast.error("Set a public slug from My Organization first")
        return
      }
      const previous = isPublic
      setIsPublic(next)
      startTransition(async () => {
        const result = await setRoadmapPublicAction(next)
        if ("error" in result) {
          setIsPublic(previous)
          toast.error(result.error)
          return
        }
        toast.success(next ? "Roadmap is now public" : "Roadmap hidden")
        onPublicChange?.(next)
      })
    },
    [canPublishPublicRoadmap, isPublic, sharePath, onPublicChange],
  )

  const isLive = isPublic && Boolean(sharePath) && sharingEnabled
  const statusLabel = isLive ? "Live" : "Offline"
  const showPublicLink = Boolean(sharePath)

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div
        data-tour="roadmap-visibility-toggle"
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2"
      >
        {isLive ? (
          <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        )}
        <span className="text-xs font-semibold text-foreground">{statusLabel}</span>
        <Switch
          checked={isPublic && Boolean(sharePath) && sharingEnabled}
          disabled={isPending || !sharePath || !sharingEnabled || !canPublishPublicRoadmap}
          onCheckedChange={handleToggle}
          aria-label="Toggle roadmap visibility"
        />
        {!canPublishPublicRoadmap ? (
          <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">
            Upgrade
          </span>
        ) : null}
      </div>
      {!canPublishPublicRoadmap ? (
        <Button asChild size="sm" variant="outline" className="h-9 rounded-full">
          <Link href="/pricing">Upgrade to publish</Link>
        </Button>
      ) : null}
      {showPublicLink ? (
        <Button
          asChild
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7 rounded-md"
          aria-label="Open public roadmap"
          title="Open public roadmap"
        >
          <a href={sharePath ?? "#"} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      ) : null}

      {showViewAction && sharePath && isPublic ? (
        <Button
          asChild
          type="button"
          size="sm"
          variant="outline"
          aria-label="View public roadmap"
          title="View public roadmap"
        >
          <a href={sharePath} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span>View live</span>
          </a>
        </Button>
      ) : null}

      {!sharePath && sharingEnabled ? (
        <Button asChild size="sm" variant="outline">
          <Link href="/my-organization">Set slug</Link>
        </Button>
      ) : null}

      {!sharingEnabled ? (
        <span className="text-xs text-muted-foreground">Public sharing is disabled until launch.</span>
      ) : null}
    </div>
  )
}
