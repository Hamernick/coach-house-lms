"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import ImagePlusIcon from "lucide-react/dist/esm/icons/image-plus"
import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollFadeEffect } from "@/components/scroll-fade-effect"
import { particleSourceKey } from "../lib"
import { useWorkspaceParticles } from "./particle-context"
import { ParticleTile } from "./particle-tile"
import { useParticleDrivePicker } from "../hooks/use-particle-drive-picker"

const WORKSPACE_PARTICLES_PANEL_SOURCE =
  "src/features/workspace-particles/components/workspace-particles-panel.tsx"
const WORKSPACE_PARTICLES_PANEL_COMPONENT = "WorkspaceParticlesPanel"
const WORKSPACE_PARTICLES_PANEL_OWNER_ID = "workspace:particles"

function particlesSurfaceProps(
  slot: string,
  surfaceKind: "trigger" | "content" | "root" = "content"
) {
  return getReactGrabLinkedSurfaceProps({
    ownerId: WORKSPACE_PARTICLES_PANEL_OWNER_ID,
    component: WORKSPACE_PARTICLES_PANEL_COMPONENT,
    source: WORKSPACE_PARTICLES_PANEL_SOURCE,
    slot,
    surfaceKind,
    canonicalOwnerSource: WORKSPACE_PARTICLES_PANEL_SOURCE,
    canonicalOwnerReason:
      "WorkspaceParticlesPanel owns its header, action controls, filters, search, and particle catalog layout.",
  })
}

const EMPTY_REFRESH = async () => {}
const EMPTY_PICKER = async (): Promise<string[]> => []

const EMPTY_INDICATOR = { left: 0, width: 0, visible: false }

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 87.3 78"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
        fill="#0066da"
      />
      <path
        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"
        fill="#00ac47"
      />
      <path
        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
        fill="#ea4335"
      />
      <path
        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
        fill="#00832d"
      />
      <path
        d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        fill="#2684fc"
      />
      <path
        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
        fill="#ffba00"
      />
    </svg>
  )
}

export const WorkspaceParticlesPanel = memo(function WorkspaceParticlesPanel() {
  const controller = useWorkspaceParticles()
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)
  const picker = useParticleDrivePicker(
    controller?.canEdit ?? false,
    controller?.refreshDrive ?? EMPTY_REFRESH,
    controller?.pickDriveFiles ?? EMPTY_PICKER
  )

  // Sliding tab indicator — same pattern as the workspace drawer
  const filterRowRef = useRef<HTMLDivElement | null>(null)
  const tabsListRef = useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = useState(EMPTY_INDICATOR)

  const updateIndicator = useCallback(() => {
    const rowEl = filterRowRef.current
    const activeEl =
      tabsListRef.current?.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      ) ?? null

    if (!rowEl || !activeEl) {
      setIndicator(EMPTY_INDICATOR)
      return
    }

    const rowRect = rowEl.getBoundingClientRect()
    const triggerRect = activeEl.getBoundingClientRect()
    const next = {
      left: triggerRect.left - rowRect.left,
      width: triggerRect.width,
      visible: true,
    }

    setIndicator((prev) => {
      if (
        prev.visible === next.visible &&
        Math.abs(prev.left - next.left) <= 0.5 &&
        Math.abs(prev.width - next.width) <= 0.5
      )
        return prev
      return next
    })
  }, [])

  useEffect(() => {
    updateIndicator()
    const raf = window.requestAnimationFrame(updateIndicator)
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateIndicator)
    if (filterRowRef.current) ro?.observe(filterRowRef.current)
    if (tabsListRef.current) ro?.observe(tabsListRef.current)
    window.addEventListener("resize", updateIndicator)
    return () => {
      window.cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener("resize", updateIndicator)
    }
  }, [filter, updateIndicator])

  if (!controller) return null
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const sources = controller.sources.filter(
    (source) =>
      (filter === "all" || source.ref.kind === filter) &&
      source.title.toLocaleLowerCase().includes(normalizedSearch)
  )
  return (
    <section
      data-particle-return-target="library"
      {...getReactGrabOwnerProps({
        ownerId: WORKSPACE_PARTICLES_PANEL_OWNER_ID,
        component: WORKSPACE_PARTICLES_PANEL_COMPONENT,
        source: WORKSPACE_PARTICLES_PANEL_SOURCE,
        slot: "root",
      })}
      className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-3 overflow-hidden p-3 sm:p-4"
    >
      <div
        {...particlesSurfaceProps("header", "root")}
        className="flex shrink-0 flex-wrap items-start justify-between gap-2"
      >
        <div>
          <h2
            {...particlesSurfaceProps("header-title", "root")}
            className="text-lg font-semibold"
          >
            Particles
          </h2>
          <p
            {...particlesSurfaceProps("header-description", "content")}
            className="text-muted-foreground mt-0.5 text-sm"
          >
            Drag onto your canvas. Bring ideas together.
          </p>
        </div>
        <div
          {...particlesSurfaceProps("header-actions", "root")}
          className="flex flex-wrap gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!controller.canEdit || controller.uploading}
            onClick={() => fileInput.current?.click()}
            {...particlesSurfaceProps("add-image-button", "trigger")}
          >
            <ImagePlusIcon data-icon="inline-start" />
            {controller.uploading ? "Uploading…" : "Add image"}
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Upload a canvas image"
          disabled={!controller.canEdit || controller.uploading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void controller.uploadImage(file)
            event.target.value = ""
          }}
        />
      </div>
      <div
        ref={filterRowRef}
        {...particlesSurfaceProps("filter-row", "root")}
        className="border-border/60 relative flex shrink-0 flex-wrap items-end justify-between gap-x-3 border-b pb-0.5"
      >
        <Tabs
          value={filter}
          onValueChange={(value) => {
            if (value) setFilter(value)
          }}
          className="w-full sm:w-auto"
        >
          <TabsList
            ref={tabsListRef}
            variant="line"
            className="h-7 w-full min-w-0 justify-start overflow-x-auto p-0 [scrollbar-width:none] group-data-[orientation=horizontal]/tabs:!h-7 sm:w-auto [&::-webkit-scrollbar]:hidden"
            {...particlesSurfaceProps("filter-tabs-list", "root")}
          >
            {[
              ["all", "All"],
              ["organization", "Organization"],
              ["activity", "Activity"],
              ["roadmap", "Roadmap"],
              ["plan", "Objectives"],
              ["drive", "Drive"],
              ["image", "Images"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-7 min-w-0 flex-none gap-2 px-2 py-1 text-sm font-medium after:hidden"
                {...particlesSurfaceProps(`filter-${value}`, "trigger")}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {/* JS-driven sliding indicator — mirrors workspace drawer pattern */}
        <span
          aria-hidden
          className="bg-foreground absolute bottom-[-1px] left-0 z-10 h-0.5 rounded-full transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: `${indicator.width}px`,
            transform: `translateX(${indicator.left}px)`,
            opacity: indicator.visible ? 1 : 0,
          }}
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find a particle…"
          aria-label="Find a particle"
          className="h-9 w-full sm:w-56"
          {...particlesSurfaceProps("search-input", "content")}
        />
      </div>
      {!controller.canEdit ? (
        <p className="text-muted-foreground text-sm">
          You have view-only access to this canvas.
        </p>
      ) : null}
      {filter === "drive" && controller.driveStatus === "loading" ? (
        <div
          aria-label="Loading Drive files"
          className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[11.75rem] rounded-[14px]" />
          ))}
        </div>
      ) : null}
      {controller.driveStatus === "error" &&
      (filter === "all" || filter === "drive") ? (
        <div
          role="status"
          className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm"
        >
          Drive files couldn’t be loaded.
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void controller.refreshDrive()}
          >
            Retry
          </Button>
          <Button variant="link" size="sm" asChild>
            <Link href="/workspace?drawer=tools">Manage Drive</Link>
          </Button>
        </div>
      ) : null}
      {sources.length ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {filter === "drive" ? (
            <div className="flex shrink-0 items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs font-medium">
                Google Drive files ({sources.length})
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!controller.canEdit || picker.pending}
                onClick={() => void picker.choose()}
                {...particlesSurfaceProps("add-drive-button", "trigger")}
                className="gap-1.5"
              >
                <GoogleDriveIcon className="size-4 shrink-0" />
                {picker.pending ? "Opening Drive…" : "Add Google Drive file"}
              </Button>
            </div>
          ) : null}
          <ScrollFadeEffect
            {...particlesSurfaceProps("sources-grid", "root")}
            className="min-h-0 flex-1 overscroll-contain pr-1 [--mask-height:2rem] [--scroll-buffer:1rem] [scrollbar-width:thin]"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              {sources.map((source) => (
                <ParticleTile
                  key={particleSourceKey(source.ref)}
                  source={source}
                />
              ))}
            </div>
          </ScrollFadeEffect>
        </div>
      ) : controller.driveStatus !== "loading" || filter !== "drive" ? (
        <div {...particlesSurfaceProps("empty-state", "content")}>
          <Empty
            size="sm"
            title="No particles here yet"
            description={
              filter === "drive"
                ? "Connect and choose documents from Google Drive to drag onto your canvas."
                : filter === "image"
                  ? "Add an image to start."
                  : "Try another search or category."
            }
            actions={
              filter === "drive" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!controller.canEdit || picker.pending}
                  onClick={() => void picker.choose()}
                  {...particlesSurfaceProps(
                    "empty-add-drive-button",
                    "trigger"
                  )}
                  className="gap-1.5"
                >
                  <GoogleDriveIcon className="size-4 shrink-0" />
                  {picker.pending ? "Opening Drive…" : "Add Google Drive file"}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : null}
      <p
        {...particlesSurfaceProps("footer-hint", "content")}
        className="text-muted-foreground shrink-0 text-xs"
      >
        Return an item here to remove it from the canvas. Its original stays
        available.
      </p>
    </section>
  )
})
