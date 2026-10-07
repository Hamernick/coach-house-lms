"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import { useRouter } from "next/navigation"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"
import {
  buildRoadmapTocItems,
  isFrameworkSection,
  resolveRoadmapSectionStatus,
} from "@/components/roadmap/roadmap-editor/helpers"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/ui/circular-progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WORKSPACE_COMPACT_PICKER_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import type { RoadmapSection } from "@/lib/roadmap"
import { cn } from "@/lib/utils"
import { requestWorkspaceRoadmapDrawer } from "@/lib/workspace/data-drawer-events"
import {
  getWorkspaceRoadmapDrawerPath,
  WORKSPACE_ROADMAP_PATH,
} from "@/lib/workspace/routes"

const owner = {
  ownerId: "roadmap-navigator-dropdown",
  component: "RoadmapNavigatorDropdown",
  source: "src/components/roadmap/roadmap-navigator-dropdown.tsx",
  tokenSource: "src/components/workspace/workspace-tutorial-theme.ts",
}

export function RoadmapNavigatorDropdown({
  sections,
  basePath = WORKSPACE_ROADMAP_PATH,
}: {
  sections: RoadmapSection[]
  basePath?: string
}) {
  const router = useRouter()
  const items = buildRoadmapTocItems(sections).flatMap((item) => [
    { section: item.section, nested: false },
    ...(item.type === "group"
      ? item.children.map((section) => ({ section, nested: true }))
      : []),
  ])

  if (!items.length) return null
  const completedCount = items.filter(
    ({ section }) => resolveRoadmapSectionStatus(section) === "complete"
  ).length
  const completionLabel = `${completedCount} of ${items.length} roadmap sections complete`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Strategic roadmap, ${completionLabel}`}
          title={completionLabel}
          className={cn(WORKSPACE_COMPACT_PICKER_CLASSNAME, "gap-1.5 text-sm")}
          {...getReactGrabOwnerProps({
            ...owner, slot: "trigger",
            primitiveImport: "@/components/ui/dropdown-menu",
          })}
        >
          <CircularProgress
            value={(completedCount / items.length) * 100}
            size={16}
            strokeWidth={2}
            decorative
            className="shrink-0"
          />
          Strategic roadmap
          <ChevronDownIcon aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(22rem,60dvh,var(--radix-dropdown-menu-content-available-height))] w-72 max-w-[calc(100vw-2rem)] overscroll-contain border-border/70 bg-muted/95 text-foreground"
        aria-label="Strategic roadmap"
        {...getReactGrabLinkedSurfaceProps({
          ...owner, slot: "content", surfaceKind: "content",
          primitiveImport: "@/components/ui/dropdown-menu",
        })}
      >
        {items.map(({ section, nested }) => {
          const status = resolveRoadmapSectionStatus(section)
          const title = isFrameworkSection(section)
            ? section.templateTitle
            : section.title
          return (
            <DropdownMenuItem
              key={section.id}
              textValue={title}
              className={cn("min-h-11 gap-2 sm:min-h-9", nested && "pl-6")}
              onSelect={() => {
                if (
                  basePath === WORKSPACE_ROADMAP_PATH &&
                  requestWorkspaceRoadmapDrawer(section.slug)
                ) return
                router.push(basePath === WORKSPACE_ROADMAP_PATH
                  ? getWorkspaceRoadmapDrawerPath(section.slug)
                  : `${basePath}/${section.slug}`)
              }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  status === "complete" ? "bg-emerald-500"
                    : status === "in_progress" ? "bg-amber-500"
                      : "border border-muted-foreground/50"
                )}
              />
              <span className="min-w-0 flex-1 truncate">{title}</span>
              <span className="sr-only">{status.replaceAll("_", " ")}</span>
              {status === "complete" ? (
                <CheckIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
