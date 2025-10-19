"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Empty } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { LessonCreationWizard, LessonWizardPayload } from "@/components/admin/lesson-creation-wizard"
import { updateClassWizardAction } from "@/app/(admin)/admin/classes/actions"
import { deleteModuleAction, setModulePublishedAction } from "@/app/(admin)/admin/classes/[id]/actions"
import {
  IconDotsVertical,
  IconNotebook,
  IconPlus,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { Check, Loader2, Pencil, Rocket } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { toast } from "sonner"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import { ExternalLink } from "lucide-react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { HeaderActionsPortal } from "@/components/header-actions-portal"

import type { ClassDef } from "./types"
import { cn } from "@/lib/utils"

type ClassOverviewProps = {
  c: ClassDef
  isAdmin?: boolean
  onStartModule?: (moduleId: string) => void
}

export function ClassOverview({ c, isAdmin = false, onStartModule }: ClassOverviewProps) {
  function getYouTubeId(raw: string | null | undefined): string | null {
    if (!raw) return null
    try {
      const u = new URL(raw)
      const host = u.hostname.toLowerCase()
      if (host.endsWith("youtube.com") || host.endsWith("m.youtube.com") || host.endsWith("www.youtube.com")) {
        const v = u.searchParams.get("v")
        if (v) return v
        const parts = u.pathname.split("/").filter(Boolean)
        const idx = parts.findIndex((p) => p === "embed" || p === "shorts")
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
      }
      if (host.endsWith("youtu.be")) {
        const id = u.pathname.replace(/^\//, "").split("/")[0]
        return id || null
      }
    } catch {}
    return null
  }
  function LazyYouTube({ id }: { id: string }) {
    const [play, setPlay] = useState(false)
    const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    return (
      <div className="rounded-lg border overflow-hidden">
        <AspectRatio ratio={16 / 9}>
          {play ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title="Class video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlay(true)}
              className="group relative h-full w-full"
              aria-label="Play video"
            >
              <img src={thumb} alt="Video thumbnail" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/30">
                <span className="inline-flex items-center justify-center rounded-full bg-white/90 p-3 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-black">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )}
        </AspectRatio>
      </div>
    )
  }
  const router = useRouter()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPayload, setWizardPayload] = useState<LessonWizardPayload | null>(null)
  const [wizardLoading, setWizardLoading] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [wizardFocusModuleId, setWizardFocusModuleId] = useState<string | null>(null)
  const [publishClassPending, startPublishClass] = useTransition()
  const [modulePublishedOverrides, setModulePublishedOverrides] = useState<Record<string, boolean | undefined>>({})
  const [classPublished, setClassPublished] = useState<boolean>(
    typeof c.published === "boolean" ? c.published : c.modules.some((module) => module.published !== false)
  )

  useEffect(() => {
    const nextPublished = typeof c.published === "boolean"
      ? c.published
      : c.modules.some((module) => module.published !== false)
    setClassPublished((prev) => (prev === nextPublished ? prev : nextPublished))
  }, [c.modules, c.published])

  useEffect(() => {
    setModulePublishedOverrides({})
  }, [c.id, c.modules])

  const loadWizardPayload = async (focusModuleId: string | null) => {
    if (!isAdmin) return
    setWizardError(null)
    setWizardPayload(null)
    setWizardFocusModuleId(focusModuleId)
    setWizardOpen(true)
    setWizardLoading(true)
    try {
      const response = await fetch(`/api/admin/classes/${c.id}/wizard`, { cache: "no-store" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to load class data")
      }
      const data = (await response.json()) as { payload: LessonWizardPayload }
      setWizardPayload(data.payload)
    } catch (error) {
      setWizardError(error instanceof Error ? error.message : "Failed to load class data")
    } finally {
      setWizardLoading(false)
    }
  }

  const handleEditClass = () => {
    void loadWizardPayload(null)
  }

  const handleEditModule = (moduleId: string) => {
    void loadWizardPayload(moduleId)
  }

  const handleCreateModule = async () => {
    if (!isAdmin) return
    setWizardError(null)
    setWizardLoading(true)
    const toastId = toast.loading("Creating module…")
    try {
      const response = await fetch(`/api/admin/classes/${c.id}/modules`, { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to create module")
      }
      const data = (await response.json()) as { moduleId?: string }
      if (!data?.moduleId) {
        throw new Error("Module id missing in response")
      }
      await loadWizardPayload(data.moduleId)
      toast.success("Module created", { id: toastId })
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create module"
      setWizardError(message)
      toast.error(message, { id: toastId })
    } finally {
      setWizardLoading(false)
    }
  }

  const resolvedModules = c.modules.map((module, index) => {
    const override = modulePublishedOverrides[module.id]
    const publishedFlag = override !== undefined ? override : module.published !== false
    return {
      ...module,
      idx: module.idx ?? index + 1,
      published: publishedFlag,
    }
  })

  const trimmedBlurb = typeof c.blurb === "string" ? c.blurb.trim() : ""
  const trimmedDescription = typeof c.description === "string" ? c.description.trim() : ""
  const heroSummary = trimmedBlurb && trimmedBlurb !== trimmedDescription ? trimmedBlurb : ""
  const description = trimmedDescription || trimmedBlurb ||
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."

  const moduleCount = resolvedModules.length
  const moduleCountLabel = moduleCount > 0 ? `${moduleCount} ${moduleCount === 1 ? "Module" : "Modules"}` : ""
  const heroSubtitle = moduleCountLabel

  const moduleIndexMap = new Map<string, number>(resolvedModules.map((module, index) => [module.id, index]))

  const publishedModules = resolvedModules.filter((module) => module.published !== false)
  const unpublishedModules = resolvedModules.filter((module) => module.published === false)

  const moduleSections = isAdmin
    ? [
        { key: "published", title: "Published", modules: publishedModules },
        { key: "unpublished", title: "Unpublished", modules: unpublishedModules },
      ]
    : [{ key: "published", title: null as string | null, modules: publishedModules }]

  const ModuleCard = ({ module }: { module: ClassDef["modules"][number] }) => {
    const [publishPending, startPublish] = useTransition()
    const position = moduleIndexMap.get(module.id)
    const moduleIndex = typeof module.idx === "number" && Number.isFinite(module.idx)
      ? module.idx
      : typeof position === "number"
        ? position + 1
        : moduleIndexMap.size + 1
    const dashboardHref = c.slug ? `/class/${c.slug}/module/${moduleIndex}` : null
    const lockedForLearners = Boolean(module.locked)
    const locked = isAdmin ? false : lockedForLearners
    const status = lockedForLearners ? "locked" : module.status ?? "not_started"
    const completed = status === "completed"
    const inProgress = status === "in_progress"
    const progress = Math.max(
      0,
      Math.min(
        100,
        typeof module.progressPercent === "number"
          ? module.progressPercent
          : completed
            ? 100
            : inProgress
              ? 50
              : 0
      )
    )
    const isPublished = module.published !== false

    const ctaLabel = locked
      ? "Complete previous modules"
      : completed
        ? "Review module"
        : inProgress
          ? "Continue learning"
          : "Start module"
    const primaryLabel = isAdmin ? "View module" : ctaLabel

    return (
      <Item
        key={module.id}
        className={cn(
          "flex h-full min-h-[260px] flex-col items-stretch gap-5 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm transition hover:shadow-md",
          locked ? "opacity-80" : "",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <ItemMedia className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <IconNotebook className="h-6 w-6" aria-hidden />
            </ItemMedia>
            <ItemContent className="min-w-0 space-y-1">
              <ItemTitle className="text-xl font-semibold leading-tight" title={module.title}>
                {module.title}
              </ItemTitle>
              {module.subtitle ? (
                <ItemDescription className="text-sm text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
                  {module.subtitle}
                </ItemDescription>
              ) : null}
            </ItemContent>
          </div>
          {isAdmin ? (
            <ItemActions className="items-start gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    disabled={publishPending}
                    onSelect={(event) => {
                      event.preventDefault()
                      startPublish(async () => {
                        const next = !isPublished
                        const toastId = toast.loading(next ? "Publishing module…" : "Unpublishing module…")
                        try {
                          await setModulePublishedAction(module.id, c.id, next)
                          setModulePublishedOverrides((prev) => ({ ...prev, [module.id]: next }))
                          toast.success(next ? "Module published" : "Module unpublished", { id: toastId })
                          router.refresh()
                        } catch (error) {
                          const message = error instanceof Error ? error.message : "Failed to update module"
                          toast.error(message, { id: toastId })
                        }
                      })
                    }}
                  >
                    {isPublished ? (
                      <>
                        <IconEyeOff className="mr-2 h-4 w-4" aria-hidden />
                        <span>Unpublish module</span>
                      </>
                    ) : (
                      <>
                        <IconEye className="mr-2 h-4 w-4" aria-hidden />
                        <span>Publish module</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      handleEditModule(module.id)
                    }}
                  >
                    <IconPencil className="mr-2 h-4 w-4" aria-hidden />
                    <span>Edit module</span>
                  </DropdownMenuItem>
                  <form
                    action={deleteModuleAction}
                    className="contents"
                    onSubmit={(event) => {
                      if (!confirm("Delete module?")) {
                        event.preventDefault()
                      }
                    }}
                  >
                    <input type="hidden" name="moduleId" value={module.id} />
                    <input type="hidden" name="classId" value={c.id} />
                    <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                      <button type="submit" className="flex w-full items-center gap-2 text-destructive focus:text-destructive">
                        <IconTrash className="h-4 w-4" aria-hidden />
                        <span>Delete module</span>
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          ) : null}
        </div>

        <ItemFooter className="mt-auto space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 overflow-hidden rounded-full" />
          </div>

          <div>
            {dashboardHref ? (
              <Button
                asChild
                size="sm"
                className={cn(
                  "w-auto px-3",
                  locked ? "bg-muted text-muted-foreground hover:bg-muted" : ""
                )}
                disabled={locked && !isAdmin}
              >
                <Link href={dashboardHref ?? "#"} prefetch>
                  {primaryLabel}
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "w-auto px-3",
                  locked ? "bg-muted text-muted-foreground hover:bg-muted" : ""
                )}
                onClick={() => {
                  if (!locked || isAdmin) onStartModule?.(module.id)
                }}
                disabled={locked && !isAdmin}
              >
                {primaryLabel}
              </Button>
            )}
          </div>
        </ItemFooter>
      </Item>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <HeaderActionsPortal>
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClass}
                disabled={wizardLoading}
                className="min-h-9 gap-2"
              >
                {wizardLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Pencil className="h-4 w-4" aria-hidden />
                )}
                <span>{wizardLoading ? "Loading…" : "Edit"}</span>
              </Button>
              <Button
                size="sm"
                variant={classPublished ? "outline" : "default"}
                disabled={publishClassPending}
                onClick={() => {
                  startPublishClass(async () => {
                    const next = !classPublished
                    const toastId = toast.loading(next ? "Publishing class…" : "Unpublishing class…")
                    try {
                      setWizardError(null)
                      const response = await fetch(`/api/admin/classes/${c.id}/publish`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ published: next }),
                      })
                      if (!response.ok) {
                        const data = await response.json().catch(() => null)
                        throw new Error(data?.error ?? "Failed to update class status")
                      }
                      const data = (await response.json()) as { published?: boolean }
                      const resolved = typeof data?.published === "boolean" ? data.published : next
                      setClassPublished(resolved)
                      toast.success(resolved ? "Class published" : "Class unpublished", { id: toastId })
                      router.refresh()
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "Failed to update class status"
                      setWizardError(message)
                      toast.error(message, { id: toastId })
                    }
                  })
                }}
                className="min-h-9 gap-2"
              >
                {publishClassPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : classPublished ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Rocket className="h-4 w-4" aria-hidden />
                )}
                <span>{publishClassPending ? "Updating…" : classPublished ? "Unpublish" : "Publish"}</span>
              </Button>
            </div>
          ) : null}
        </HeaderActionsPortal>
        <div className="space-y-4 min-w-0 flex-1">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{c.title}</h1>
            {heroSubtitle ? <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground/80">{heroSubtitle}</p> : null}
            {heroSummary ? (
              <p className="text-sm text-muted-foreground max-w-4xl">{heroSummary}</p>
            ) : null}
          </div>
          {c.videoUrl ? (
            <div className="max-w-4xl">
              {(() => {
                const id = getYouTubeId(c.videoUrl)
                return id ? (
                  <LazyYouTube id={id} />
                ) : null
              })()}
            </div>
          ) : null}

          {description ? (
            <article className="prose prose-sm dark:prose-invert text-muted-foreground max-w-4xl">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{description}</ReactMarkdown>
            </article>
          ) : null}
          {c.resources && c.resources.length > 0 ? (
            <div className="max-w-4xl">
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                {c.resources.map(({ label, url, provider }, index) => {
                  const Icon = PROVIDER_ICON[String(provider)] ?? PROVIDER_ICON.generic
                  const host = (() => {
                    try {
                      const u = new URL(url)
                      return u.hostname.replace(/^www\./, "")
                    } catch {
                      return url
                    }
                  })()
                  return (
                    <Item key={`${url}-${index}`} asChild>
                      <a href={url} target="_blank" rel="noreferrer" title={`${label} — ${url}`}>
                        <ItemMedia className="text-muted-foreground">
                          <Icon className="h-5 w-5" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle className="text-foreground">{label}</ItemTitle>
                          <ItemDescription className="truncate">
                            {host}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </ItemActions>
                      </a>
                    </Item>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
        {wizardError ? <p className="max-w-xs text-right text-xs text-rose-500">{wizardError}</p> : null}
      </div>
      <Separator />
      {moduleSections.map((section) => {
        if (!section.title) {
          return (
            <div key={section.key} className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
              {section.modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          )
        }

        return (
          <div key={section.key} className="space-y-3">
            {section.title ? (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h2>
              </div>
            ) : null}
            {section.modules.length > 0 ? (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
                {section.modules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
                <Empty
                  icon={<IconNotebook className="h-6 w-6" aria-hidden />}
                  title={section.key === "published" ? "No published modules" : section.key === "unpublished" ? "No unpublished modules" : "No modules yet"}
                  description={
                    section.key === "published"
                      ? "Publish modules to make them visible to learners."
                      : section.key === "unpublished"
                        ? "Create new modules or unpublish existing ones to draft here."
                        : "Check back soon for lessons in this class."
                  }
                  className="min-h-[260px]"
                  actions={isAdmin ? (
                    <Button type="button" size="sm" className="gap-2" onClick={handleCreateModule} disabled={wizardLoading}>
                      {wizardLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <IconPlus className="h-4 w-4" aria-hidden />
                      )}
                      <span>{wizardLoading ? "Loading…" : "Add module"}</span>
                    </Button>
                  ) : null}
                />
              </div>
            )}
          </div>
        )
      })}
      {isAdmin ? (
        <LessonCreationWizard
          open={wizardOpen}
          mode="edit"
          classId={c.id}
          initialPayload={wizardPayload}
          focusModuleId={wizardFocusModuleId}
          loading={wizardLoading}
          onCreateModule={handleCreateModule}
          onOpenChange={(value) => {
            setWizardOpen(value)
            if (!value) {
              setWizardPayload(null)
              setWizardFocusModuleId(null)
            }
          }}
          onSubmit={updateClassWizardAction}
        />
      ) : null}
    </div>
  )
}
