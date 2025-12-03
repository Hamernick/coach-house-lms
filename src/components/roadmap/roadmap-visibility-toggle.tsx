"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import GlobeIcon from "lucide-react/dist/esm/icons/globe"

import { setRoadmapPublicAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"

export function RoadmapVisibilityToggle({
  initialPublic,
  publicSlug,
}: {
  initialPublic: boolean
  publicSlug: string | null
}) {
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [isPending, startTransition] = useTransition()

  const sharePath = useMemo(() => {
    if (!publicSlug || publicSlug.trim().length === 0) return null
    return `/org/${publicSlug}/roadmap`
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
      })
    },
    [isPublic, sharePath],
  )

  const handleCopy = useCallback(async () => {
    if (!sharePath) return
    try {
      const url =
        typeof window !== "undefined" && window?.location
          ? `${window.location.origin}${sharePath}`
          : sharePath
      await navigator.clipboard.writeText(url)
      setCopyState("copied")
      toast.success("Share link copied")
      setTimeout(() => setCopyState("idle"), 2000)
    } catch {
      toast.error("Unable to copy link")
    }
  }, [sharePath])

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Visibility</p>
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold leading-tight">
              <GlobeIcon className="h-4 w-4 text-muted-foreground" />
              Strategic Roadmap
            </p>
            <p className="text-sm text-muted-foreground">
              {sharePath
                ? "When enabled, anyone with the link can read your roadmap."
                : "Add a public slug on the My Organization page before sharing your roadmap."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/40 px-4 py-2">
          <Switch
            checked={isPublic && Boolean(sharePath)}
            disabled={isPending || !sharePath}
            onCheckedChange={handleToggle}
            aria-label="Toggle roadmap visibility"
          />
          <span className="text-sm font-medium text-muted-foreground">{isPublic && sharePath ? "Public" : "Private"}</span>
        </div>
      </div>
      {sharePath ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="rounded-xl border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-foreground">{sharePath}</code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            className="gap-2"
            onClick={handleCopy}
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {copyState === "copied" ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-amber-600">
          Assign a short, unique slug under My Organization → Settings before publishing your roadmap.
        </p>
      )}
    </div>
  )
}
