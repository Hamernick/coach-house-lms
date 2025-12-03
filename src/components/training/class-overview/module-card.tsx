"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import EyeIcon from "lucide-react/dist/esm/icons/eye"
import EyeOffIcon from "lucide-react/dist/esm/icons/eye-off"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import { toast } from "@/lib/toast"

import { deleteModuleAction } from "@/app/(admin)/admin/classes/[id]/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type { ClassDef } from "../types"

type ModuleCardProps = {
  classId: string
  classSlug: string | null
  isAdmin: boolean
  showAdminActions?: boolean
  module: ClassDef["modules"][number]
  moduleIndex: number
  lockedForLearners: boolean
  onStartModule?: (moduleId: string) => void
  onEditModule?: (moduleId: string) => void
  onTogglePublish?: (moduleId: string, next: boolean) => Promise<void>
}

export function ModuleCard({
  classId,
  classSlug,
  isAdmin,
  showAdminActions = false,
  module,
  moduleIndex,
  lockedForLearners,
  onStartModule,
  onEditModule,
  onTogglePublish,
}: ModuleCardProps) {
  const router = useRouter()
  const [publishPending, startPublish] = useTransition()

  const dashboardHref = classSlug ? `/class/${classSlug}/module/${moduleIndex}` : null
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
  const isPublished = module.published !== false

  const ctaLabel = locked
    ? "Complete previous modules"
    : completed
      ? "Review module"
      : inProgress
        ? "Continue learning"
        : "Start module"
  const primaryLabel = isAdmin ? "View module" : ctaLabel

  const handlePublishToggle = (next: boolean) => {
    if (!onTogglePublish) {
      return
    }

    startPublish(async () => {
      const toastId = toast.loading(next ? "Publishing module…" : "Unpublishing module…")
      try {
        await onTogglePublish(module.id, next)
        toast.success(next ? "Module published" : "Module unpublished", { id: toastId })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update module"
        toast.error(message, { id: toastId })
      }
    })
  }

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
        {isAdmin && showAdminActions ? (
          <ItemActions className="items-start gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  disabled={publishPending}
                  onSelect={(event) => {
                    event.preventDefault()
                    handlePublishToggle(!isPublished)
                  }}
                >
                  {isPublished ? (
                    <>
                      <EyeOffIcon className="mr-2 h-4 w-4" aria-hidden />
                      <span>Unpublish module</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon className="mr-2 h-4 w-4" aria-hidden />
                      <span>Publish module</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    onEditModule?.(module.id)
                  }}
                >
                  <PencilIcon className="mr-2 h-4 w-4" aria-hidden />
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
                  <input type="hidden" name="classId" value={classId} />
                  <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                    <button type="submit" className="flex w-full items-center gap-2 text-destructive focus:text-destructive">
                      <Trash2Icon className="h-4 w-4" aria-hidden />
                      <span>Delete module</span>
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        ) : null}
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
