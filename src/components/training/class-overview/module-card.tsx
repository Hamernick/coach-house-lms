"use client"

import Link from "next/link"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type { ClassDef } from "../types"

type ModuleCardProps = {
  classSlug: string | null
  isAdmin: boolean
  module: ClassDef["modules"][number]
  moduleIndex: number
  lockedForLearners: boolean
  basePath?: string
  onStartModule?: (moduleId: string) => void
}

export function ModuleCard({
  classSlug,
  isAdmin,
  module,
  moduleIndex,
  lockedForLearners,
  basePath = "",
  onStartModule,
}: ModuleCardProps) {
  const dashboardHref = classSlug ? `${basePath}/class/${classSlug}/module/${moduleIndex}` : null
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
            : 0,
    ),
  )
  const ctaLabel = locked
    ? "Complete previous modules"
    : completed
      ? "Review module"
      : inProgress
        ? "Continue learning"
        : "Start module"
  const primaryLabel = isAdmin ? "View module" : ctaLabel

  const hasSubtitle = Boolean(module.subtitle)

  return (
    <Item
      key={module.id}
      className={cn(
        "flex h-full min-h-[220px] flex-col items-stretch gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm transition hover:shadow-md",
        locked ? "opacity-80" : "",
      )}
    >
      <div className={cn("flex justify-between gap-4", hasSubtitle ? "items-start" : "items-center")}>
        <div className={cn("flex min-w-0 flex-1 gap-4", hasSubtitle ? "items-start" : "items-center")}>
          <ItemMedia className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <NotebookIcon className="h-6 w-6" aria-hidden />
          </ItemMedia>
          <ItemContent className="min-w-0 space-y-1">
            <ItemTitle
              className="text-xl font-semibold leading-tight whitespace-normal [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden"
              title={module.title}
            >
              {module.title}
            </ItemTitle>
            {hasSubtitle ? (
              <ItemDescription className="text-sm text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
                {module.subtitle}
              </ItemDescription>
            ) : null}
          </ItemContent>
        </div>
      </div>

      <ItemFooter className="mt-auto space-y-3 pt-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 overflow-hidden rounded-full bg-foreground/10 [&>[data-slot=progress-indicator]]:bg-foreground"
          />
        </div>

        <div>
          {dashboardHref ? (
            <Button
              asChild
              size="sm"
              className={cn(
                "w-auto px-3 bg-foreground text-background hover:bg-foreground/90",
                locked && !isAdmin && "bg-muted text-muted-foreground hover:bg-muted",
              )}
              disabled={locked && !isAdmin}
            >
              <Link href={dashboardHref} prefetch>
                {primaryLabel}
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className={cn(
                "w-auto px-3 bg-foreground text-background hover:bg-foreground/90",
                locked && !isAdmin && "bg-muted text-muted-foreground hover:bg-muted",
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
