"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import Link from "next/link"

import { setRoadmapPublicAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"
import { publicSharingEnabled } from "@/lib/feature-flags"

export function RoadmapVisibilityToggle({
  initialPublic,
  publicSlug,
  onPublicChange,
}: {
  initialPublic: boolean
  publicSlug: string | null
  onPublicChange?: (next: boolean) => void
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
    [isPublic, sharePath, onPublicChange],
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2">
        <Switch
          checked={isPublic && Boolean(sharePath)}
          disabled={isPending || !sharePath || !sharingEnabled}
          onCheckedChange={handleToggle}
          aria-label="Toggle roadmap visibility"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {isPublic && sharePath ? "Public" : "Private"}
        </span>
      </div>

      {sharePath && isPublic ? (
        <Button
          asChild
          type="button"
          size="sm"
          variant="outline"
          aria-label="View public roadmap"
          title="View public roadmap"
        >
          <a href={sharePath} target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="h-4 w-4" aria-hidden />
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
