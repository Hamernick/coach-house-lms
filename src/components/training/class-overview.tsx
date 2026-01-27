"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { Empty } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"

import type { ClassDef } from "./types"
import { ModuleCard } from "./class-overview/module-card"
import { getYouTubeId, LazyYouTube } from "./class-overview/video-preview"

type ClassOverviewProps = {
  c: ClassDef
  isAdmin?: boolean
  onStartModule?: (moduleId: string) => void
}

export function ClassOverview({ c, isAdmin = false, onStartModule }: ClassOverviewProps) {
  const pathname = usePathname()
  const basePath = pathname?.startsWith("/accelerator") ? "/accelerator" : ""
  const resolvedModules = useMemo(
    () =>
      c.modules.map((module, index) => ({
        ...module,
        idx: module.idx ?? index + 1,
      })),
    [c.modules],
  )

  const trimmedBlurb = typeof c.blurb === "string" ? c.blurb.trim() : ""
  const trimmedDescription = typeof c.description === "string" ? c.description.trim() : ""
  const heroSummary = trimmedBlurb && trimmedBlurb !== trimmedDescription ? trimmedBlurb : ""
  const description = trimmedDescription || trimmedBlurb ||
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."

  const visibleModules = useMemo(
    () => (isAdmin ? resolvedModules : resolvedModules.filter((module) => module.published !== false)),
    [isAdmin, resolvedModules],
  )

  const moduleCount = visibleModules.length
  const moduleCountLabel = moduleCount > 0 ? `${moduleCount} ${moduleCount === 1 ? "Module" : "Modules"}` : ""
  const heroSubtitle = moduleCountLabel

  return (
    <div className="space-y-5">
      <div>
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
      </div>
      <Separator />
      {visibleModules.length > 0 ? (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
          {visibleModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              classSlug={c.slug ?? null}
              isAdmin={isAdmin}
              moduleIndex={module.idx}
              lockedForLearners={Boolean(module.locked)}
              basePath={basePath}
              onStartModule={onStartModule}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
          <Empty
            icon={<NotebookIcon className="h-6 w-6" aria-hidden />}
            title="No modules yet"
            description="Check back soon for lessons in this class."
            className="min-h-[260px]"
          />
        </div>
      )}
    </div>
  )
}
