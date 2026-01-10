"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Empty } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { LessonCreationWizard } from "@/components/admin/lesson-creation-wizard"
import type { LessonWizardPayload } from "@/lib/lessons/types"
import { createClassWizardAction, updateClassWizardAction } from "@/app/(admin)/admin/classes/actions"
import { setModulePublishedAction } from "@/app/(admin)/admin/classes/[id]/actions"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Check from "lucide-react/dist/esm/icons/check"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Pencil from "lucide-react/dist/esm/icons/pencil"
import Rocket from "lucide-react/dist/esm/icons/rocket"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { toast } from "@/lib/toast"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import { HeaderActionsPortal } from "@/components/header-actions-portal"

import type { ClassDef } from "./types"
import { ModuleCard } from "./class-overview/module-card"
import { getYouTubeId, LazyYouTube } from "./class-overview/video-preview"

type ClassOverviewProps = {
  c: ClassDef
  isAdmin?: boolean
  onStartModule?: (moduleId: string) => void
}

export function ClassOverview({ c, isAdmin = false, onStartModule }: ClassOverviewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const basePath = pathname?.startsWith("/accelerator") ? "/accelerator" : ""
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

  const moduleIndexMap = useMemo(
    () => new Map<string, number>(resolvedModules.map((module, index) => [module.id, index])),
    [resolvedModules],
  )

  const publishedModules = resolvedModules.filter((module) => module.published !== false)
  const unpublishedModules = resolvedModules.filter((module) => module.published === false)

  const handleToggleModulePublished = useCallback(
    async (moduleId: string, next: boolean) => {
      try {
        await setModulePublishedAction(moduleId, c.id, next)
        setModulePublishedOverrides((prev) => ({ ...prev, [moduleId]: next }))
      } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to update module")
      }
    },
    [c.id],
  )

  const getModuleIndex = useCallback(
    (module: ClassDef["modules"][number]) => {
      if (typeof module.idx === "number" && Number.isFinite(module.idx)) {
        return module.idx
      }
      const position = moduleIndexMap.get(module.id)
      return typeof position === "number" ? position + 1 : moduleIndexMap.size + 1
    },
    [moduleIndexMap],
  )

  const moduleSections = isAdmin
    ? [
        { key: "published", title: "Published", modules: publishedModules },
        { key: "unpublished", title: "Unpublished", modules: unpublishedModules },
      ]
    : [{ key: "published", title: null as string | null, modules: publishedModules }]

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
                <ModuleCard
                  key={module.id}
                  module={module}
                  classId={c.id}
                  classSlug={c.slug ?? null}
                  isAdmin={isAdmin}
                  showAdminActions={false}
                  moduleIndex={getModuleIndex(module)}
                  lockedForLearners={Boolean(module.locked)}
                  basePath={basePath}
                  onStartModule={onStartModule}
                  onEditModule={handleEditModule}
                  onTogglePublish={handleToggleModulePublished}
                />
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
                  <ModuleCard
                    key={module.id}
                    module={module}
                    classId={c.id}
                    classSlug={c.slug ?? null}
                    isAdmin={isAdmin}
                    showAdminActions={false}
                    moduleIndex={getModuleIndex(module)}
                    lockedForLearners={Boolean(module.locked)}
                    basePath={basePath}
                    onStartModule={onStartModule}
                    onEditModule={handleEditModule}
                    onTogglePublish={handleToggleModulePublished}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
                <Empty
                  icon={<NotebookIcon className="h-6 w-6" aria-hidden />}
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
                    <PlusIcon className="h-4 w-4" aria-hidden />
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
          mode={wizardPayload ? "edit" : "create"}
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
          onSubmit={async (formData) => {
            const payloadRaw = formData.get("payload")
            const classIdValue = formData.get("classId") ?? c.id
            if (typeof payloadRaw !== "string" || typeof classIdValue !== "string") {
              return { error: "Invalid lesson payload" }
            }
            if (wizardPayload) {
              return updateClassWizardAction(classIdValue, payloadRaw)
            }
            return createClassWizardAction(formData)
          }}
        />
      ) : null}
    </div>
  )
}
