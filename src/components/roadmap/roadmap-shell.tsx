"use client"

import { useId, useState } from "react"

import Image from "next/image"

import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"

import { RoadmapEditor } from "@/components/roadmap/roadmap-editor"
import type { RoadmapSection } from "@/lib/roadmap"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/lib/toast"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import { setRoadmapHeroImageAction } from "@/app/(dashboard)/strategic-roadmap/actions"

type RoadmapShellProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  initialPublic: boolean
  heroUrl: string | null
  onDirtyChange?: (dirty: boolean) => void
  onRegisterDiscard?: (handler: (() => void) | null) => void
}

const HERO_GRADIENT =
  "linear-gradient(to bottom right,#fcc5e4,#fda34b,#ff7882,#c8699e,#7046aa,#0c1db8,#020f75)"

export function RoadmapShell({
  sections,
  publicSlug,
  initialPublic,
  heroUrl: initialHeroUrl,
  onDirtyChange,
  onRegisterDiscard,
}: RoadmapShellProps) {
  const heroInputId = useId()
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [heroUrl, setHeroUrl] = useState(initialHeroUrl ?? "")
  const [isUploadingHero, setIsUploadingHero] = useState(false)
  const [isSavingHero, setIsSavingHero] = useState(false)

  const saveHero = async (nextUrl: string | null, toastId?: string | number) => {
    setIsSavingHero(true)
    try {
      const result = await setRoadmapHeroImageAction(nextUrl)
      if ("error" in result) {
        if (toastId) {
          toast.error(result.error, { id: toastId })
        } else {
          toast.error(result.error)
        }
        return
      }
      setHeroUrl(nextUrl ?? "")
      const message = nextUrl ? "Hero image updated" : "Hero image removed"
      if (toastId) {
        toast.success(message, { id: toastId })
      } else {
        toast.success(message)
      }
    } finally {
      setIsSavingHero(false)
    }
  }

  const handleHeroUpload = async (file: File) => {
    const error = validateOrgMediaFile(file)
    if (error) {
      toast.error(error)
      return
    }
    setIsUploadingHero(true)
    const toastId = toast.loading("Uploading hero image…")
    try {
      const url = await uploadOrgMedia({ file, kind: "roadmap" })
      await saveHero(url, toastId)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
    } finally {
      setIsUploadingHero(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-3 sm:max-w-2xl">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
            <WaypointsIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Strategic roadmap</h1>
            <p className="text-sm text-muted-foreground">
              A pitch-ready snapshot of what you are building. Use it to show funders a clear path, proof of progress,
              and what comes next.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Roadmap hero image</h2>
            <p className="text-sm text-muted-foreground">Shown on the public roadmap page header. Gradient is used if empty.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={heroInputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (!file) return
                void handleHeroUpload(file)
                event.currentTarget.value = ""
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={isUploadingHero || isSavingHero}
                  aria-label="Roadmap hero image actions"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild disabled={isUploadingHero || isSavingHero} className="cursor-pointer">
                  <label htmlFor={heroInputId} className="flex w-full cursor-pointer items-center gap-2">
                    {isUploadingHero ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading…
                      </>
                    ) : heroUrl ? (
                      "Change image"
                    ) : (
                      "Upload image"
                    )}
                  </label>
                </DropdownMenuItem>
                {heroUrl ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={isSavingHero || isUploadingHero}
                      onSelect={() => void saveHero(null)}
                    >
                      Remove image
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative mt-4 h-40 w-full overflow-hidden rounded-xl border border-border/50 sm:h-48">
          {heroUrl ? <Image src={heroUrl} alt="" fill className="object-cover" sizes="100vw" /> : null}
          <div className="absolute inset-0" style={{ backgroundImage: heroUrl ? undefined : HERO_GRADIENT }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/50" />
        </div>
      </section>

      <RoadmapEditor
        sections={sections}
        publicSlug={publicSlug}
        roadmapIsPublic={isPublic}
        onRoadmapPublicChange={setIsPublic}
        onDirtyChange={onDirtyChange}
        onRegisterDiscard={onRegisterDiscard}
      />
    </div>
  )
}
