"use client"

import { useId, useRef, useState } from "react"

import Image from "next/image"

import ImageIcon from "lucide-react/dist/esm/icons/image"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Plus from "lucide-react/dist/esm/icons/plus"

import {
  RoadmapEditor,
  type RoadmapEditorLayout,
} from "@/components/roadmap/roadmap-editor"
import { ProgramCard } from "@/components/programs/program-card"
import { Button } from "@/components/ui/button"
import type { RoadmapSection } from "@/lib/roadmap"
import { toast } from "@/lib/toast"
import {
  uploadOrgMedia,
  validateOrgMediaFile,
} from "@/lib/organization/org-media"
import { setRoadmapHeroImageAction } from "@/actions/roadmap"
import { cn } from "@/lib/utils"

type RoadmapShellProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  canEdit?: boolean
  heroUrl: string | null
  showHeader?: boolean
  headerLayout?: "row" | "column"
  programPreview?: {
    title: string
    location?: string | null
    imageUrl?: string | null
    statusLabel?: string | null
    chips?: string[] | null
    goalCents?: number | null
    raisedCents?: number | null
    ctaLabel?: string | null
    ctaHref?: string | null
    ctaTarget?: string | null
  } | null
  showHeroEditor?: boolean
  showProgramPreview?: boolean
  editorLayout?: RoadmapEditorLayout
  initialSectionId?: string | null
  onDirtyChange?: (dirty: boolean) => void
  onRegisterDiscard?: (handler: (() => void) | null) => void
}

const DOT_PATTERN_CLASSES = [
  "absolute inset-0",
  "[background-size:20px_20px]",
  "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
  "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
]

export function RoadmapShell({
  sections,
  publicSlug,
  canEdit = true,
  heroUrl: initialHeroUrl,
  showHeader = true,
  headerLayout = "row",
  programPreview,
  showHeroEditor = true,
  showProgramPreview = false,
  editorLayout = "default",
  initialSectionId = null,
  onDirtyChange,
  onRegisterDiscard,
}: RoadmapShellProps) {
  const heroInputId = useId()
  const heroInputRef = useRef<HTMLInputElement | null>(null)
  const [heroUrl, setHeroUrl] = useState(initialHeroUrl ?? "")
  const [isUploadingHero, setIsUploadingHero] = useState(false)
  const [isSavingHero, setIsSavingHero] = useState(false)

  const saveHero = async (
    nextUrl: string | null,
    toastId?: string | number
  ) => {
    if (!canEdit) return
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
    if (!canEdit) return
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
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      })
    } finally {
      setIsUploadingHero(false)
    }
  }

  const isHeroImage = heroUrl.trim().length > 0
  const swatchBase =
    "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
  const fallbackProgram = {
    title: "Program preview",
    location: "Add your first program",
    imageUrl: null,
    statusLabel: "Program",
    chips: ["Outcomes", "Staffing", "Budget"],
    goalCents: 0,
    raisedCents: 0,
    ctaLabel: "Create program",
    ctaHref: "/organization?tab=programs",
    ctaTarget: "_self",
  }
  const programCard = programPreview ?? fallbackProgram

  return (
    <>
      {!showHeader ? <h1 className="sr-only">Strategic roadmap</h1> : null}
      <div className="flex min-h-full flex-1 flex-col gap-5">
        {showHeader ? (
          <header
            className={cn(
              "flex gap-4",
              headerLayout === "column"
                ? "flex-col items-start"
                : "flex-wrap items-start"
            )}
          >
            <span className="border-border/60 bg-muted/40 text-muted-foreground inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
              <WaypointsIcon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-2 sm:max-w-2xl">
              <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                Strategic roadmap
              </h1>
              <p className="text-muted-foreground text-sm">
                A pitch-ready snapshot of what you are building. Use it to show
                funders a clear path, proof of progress, and what comes next.
              </p>
            </div>
          </header>
        ) : null}

        {showHeroEditor ? (
          <section className="border-border/60 bg-card/70 rounded-2xl border p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Roadmap hero image</h2>
                <p className="text-muted-foreground text-sm">
                  Shown on the public roadmap page header. Dot grid is used if
                  empty.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={heroInputId}
                  ref={heroInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={!canEdit}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (!file) return
                    void handleHeroUpload(file)
                    event.currentTarget.value = ""
                  }}
                />
                <div className="border-border/60 bg-background/80 flex items-center gap-2 rounded-full border px-2 py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      swatchBase,
                      !isHeroImage && "ring-foreground/40 ring-2"
                    )}
                    aria-label="Use dot grid background"
                    aria-pressed={!isHeroImage}
                    disabled={!canEdit || isUploadingHero || isSavingHero}
                    onClick={() => {
                      if (isHeroImage) void saveHero(null)
                    }}
                  >
                    <span className={cn(DOT_PATTERN_CLASSES)} />
                    <span className="bg-background pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      swatchBase,
                      isHeroImage && "ring-foreground/40 ring-2"
                    )}
                    aria-label="Use hero image"
                    aria-pressed={isHeroImage}
                    disabled={!canEdit || isUploadingHero || isSavingHero}
                    onClick={() => {
                      if (isHeroImage) return
                      heroInputRef.current?.click()
                    }}
                  >
                    {isHeroImage ? (
                      <Image
                        src={heroUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <ImageIcon
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden
                      />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={swatchBase}
                    aria-label="Upload hero image"
                    disabled={!canEdit || isUploadingHero || isSavingHero}
                    onClick={() => heroInputRef.current?.click()}
                  >
                    {isUploadingHero || isSavingHero ? (
                      <Loader2
                        className="text-muted-foreground h-4 w-4 animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <Plus
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden
                      />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-border/50 relative mt-4 h-40 w-full overflow-hidden rounded-xl border sm:h-48">
              {heroUrl ? (
                <Image
                  src={heroUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1280px) 768px, 960px"
                />
              ) : null}
              {!heroUrl ? (
                <>
                  <div className={cn(DOT_PATTERN_CLASSES)} />
                  <div className="bg-background pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        {showProgramPreview ? (
          <div className="flex">
            <ProgramCard
              title={programCard.title}
              location={programCard.location ?? undefined}
              imageUrl={programCard.imageUrl ?? undefined}
              statusLabel={programCard.statusLabel ?? undefined}
              chips={programCard.chips ?? undefined}
              goalCents={programCard.goalCents ?? 0}
              raisedCents={programCard.raisedCents ?? 0}
              ctaLabel={programCard.ctaLabel ?? undefined}
              ctaHref={programCard.ctaHref ?? undefined}
              ctaTarget={programCard.ctaTarget ?? undefined}
              variant="medium"
            />
          </div>
        ) : null}

        <RoadmapEditor
          sections={sections}
          publicSlug={publicSlug}
          layout={editorLayout}
          initialSectionId={initialSectionId}
          onDirtyChange={onDirtyChange}
          onRegisterDiscard={onRegisterDiscard}
          canEdit={canEdit}
        />
      </div>
    </>
  )
}
