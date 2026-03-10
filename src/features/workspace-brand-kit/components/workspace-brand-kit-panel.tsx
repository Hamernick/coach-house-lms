"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import PencilLineIcon from "lucide-react/dist/esm/icons/pencil-line"
import SwatchBookIcon from "lucide-react/dist/esm/icons/swatch-book"
import TypeIcon from "lucide-react/dist/esm/icons/type"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useWorkspaceBrandKitController } from "../hooks/use-workspace-brand-kit-controller"
import type { WorkspaceBrandKitInput } from "../types"
import { WorkspaceBrandKitDownloadButton } from "./workspace-brand-kit-download-button"
import { WorkspaceBrandKitSheet } from "./workspace-brand-kit-sheet"

function statusCopy(status: ReturnType<typeof useWorkspaceBrandKitController>["readiness"]["status"]) {
  if (status === "ready") return { label: "Ready", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" }
  if (status === "in-progress") return { label: "In progress", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" }
  return { label: "Needs setup", className: "bg-muted text-muted-foreground" }
}

function AssetStatusRow({
  title,
  ready,
  imageUrl,
  fallback,
}: {
  title: string
  ready: boolean
  imageUrl: string | null | undefined
  fallback: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-3 py-2.5">
      <div className="border-border/60 bg-background relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill sizes="48px" className="object-contain p-2" />
        ) : (
          <span className="text-muted-foreground text-[10px]">{fallback}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{ready ? "Added" : "Missing"}</p>
      </div>
      {ready ? <BadgeCheckIcon className="h-4 w-4 text-emerald-500" aria-hidden /> : null}
    </div>
  )
}

function SegmentedTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: "overview" | "assets"
  onTabChange: (value: "overview" | "assets") => void
}) {
  const tabs: Array<{ id: "overview" | "assets"; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "assets", label: "Assets" },
  ]

  return (
    <div className="inline-flex items-center rounded-full bg-muted/70 p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.id
        return (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={active}
            className={cn(
              "h-7 rounded-full px-2.5 text-[11px] font-medium",
              active
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </Button>
        )
      })}
    </div>
  )
}

type WorkspaceBrandKitPanelProps = {
  input: WorkspaceBrandKitInput
}

export function WorkspaceBrandKitPanel({ input }: WorkspaceBrandKitPanelProps) {
  const controller = useWorkspaceBrandKitController(input)
  const [activeTab, setActiveTab] = useState<"overview" | "assets">("overview")
  const status = statusCopy(controller.readiness.status)
  const boilerplate = controller.draftProfile.boilerplate?.trim() ?? ""
  const palette = controller.palette
  const typographySummary = useMemo(() => {
    if (!controller.typographyPreset) return "Choose a preset"
    return `${controller.typographyPreset.headingFontLabel} / ${controller.typographyPreset.bodyFontLabel}`
  }, [controller.typographyPreset])
  const title = (controller.draftProfile.name ?? "").trim() || "Set your organization basics"
  const subtitle =
    (controller.draftProfile.tagline ?? "").trim() ||
    "A simple, reusable system for logos, colors, and copy."

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>
              {status.label}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {controller.readiness.completedCount}/{controller.readiness.totalCount} essentials
            </span>
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="line-clamp-1 text-sm font-medium text-foreground">
              {title}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="self-start">
            <SegmentedTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden">
            <div className="min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-background/35 p-3">
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground">Boilerplate</p>
                <p className="mt-1 line-clamp-5 text-sm leading-relaxed text-foreground">
                  {boilerplate || "Add a short narrative that your team can reuse for bios, grant applications, and flyers."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SwatchBookIcon className="h-3.5 w-3.5" aria-hidden />
                  Palette
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {palette.length > 0 ? (
                    palette.map((color) => (
                      <span key={color} className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2 py-1 text-[11px] text-foreground">
                        <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                        {color}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Choose a primary color and a few supporting colors.</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                  Typography
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {controller.typographyPreset?.label ?? "No preset selected"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{typographySummary}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden">
            <div className="grid gap-2">
              <AssetStatusRow
                title="Primary logo"
                ready={controller.readiness.hasPrimaryLogo}
                imageUrl={controller.draftProfile.logoUrl}
                fallback="Logo"
              />
              <AssetStatusRow
                title="Logo mark"
                ready={controller.readiness.hasLogoMark}
                imageUrl={controller.draftProfile.brandMarkUrl}
                fallback="Mark"
              />
              <AssetStatusRow
                title="Banner image"
                ready={Boolean(controller.draftProfile.headerUrl?.trim())}
                imageUrl={controller.draftProfile.headerUrl}
                fallback="Banner"
              />
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
              <p className="text-xs font-medium text-muted-foreground">File guidance</p>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-foreground">
                SVG is preferred for logos. PNG, JPEG, and WebP are accepted across the kit. Use a wide primary logo, a square mark, and a wide banner image for profile headers.
              </p>
            </div>
            <div className="min-h-0 overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted/15 p-3">
              <p className="text-xs font-medium text-muted-foreground">Social connections</p>
              <p className="mt-1 line-clamp-3 text-sm text-foreground">Instagram, LinkedIn, X, Facebook, and newsletter sync are staged as coming soon.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
          <Button type="button" size="sm" className="w-full" onClick={() => controller.setIsSheetOpen(true)}>
            <PencilLineIcon className="h-3.5 w-3.5" aria-hidden />
            {input.canEdit ? "View / edit" : "View details"}
          </Button>
          <WorkspaceBrandKitDownloadButton href="/api/account/org-brand-kit/download" className="w-full" />
        </div>
      </div>

      <WorkspaceBrandKitSheet controller={controller} canEdit={input.canEdit} />
    </>
  )
}
