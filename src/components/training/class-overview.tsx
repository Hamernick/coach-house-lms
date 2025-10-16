"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { LessonCreationWizard, LessonWizardPayload } from "@/components/admin/lesson-creation-wizard"
import { updateClassWizardAction } from "@/app/(admin)/admin/classes/actions"
import { createModuleAction, deleteModuleAction } from "@/app/(admin)/admin/classes/[id]/actions"
import {
  IconDotsVertical,
  IconLock,
  IconNotebook,
  IconPlayerPlay,
  IconCircleCheck,
} from "@tabler/icons-react"

import type { ClassDef } from "./types"
import { cn } from "@/lib/utils"

type ClassOverviewProps = {
  c: ClassDef
  isAdmin?: boolean
  onStartModule?: (moduleId: string) => void
}

export function ClassOverview({ c, isAdmin = false, onStartModule }: ClassOverviewProps) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPayload, setWizardPayload] = useState<LessonWizardPayload | null>(null)
  const [wizardLoading, setWizardLoading] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)

  const handleEditClass = async () => {
    if (!isAdmin) return
    setWizardError(null)
    setWizardLoading(true)
    try {
      const response = await fetch(`/api/admin/classes/${c.id}/wizard`, { cache: "no-store" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to load class data")
      }
      const data = (await response.json()) as { payload: LessonWizardPayload }
      setWizardPayload(data.payload)
      setWizardOpen(true)
    } catch (error) {
      setWizardError(error instanceof Error ? error.message : "Failed to load class data")
    } finally {
      setWizardLoading(false)
    }
  }

  const trimmedBlurb = typeof c.blurb === "string" ? c.blurb.trim() : ""
  const trimmedDescription = typeof c.description === "string" ? c.description.trim() : ""
  const description = trimmedDescription || trimmedBlurb ||
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."

  const moduleCount = c.modules.length
  const totalDuration = c.modules.reduce((sum, module) => {
    return sum + (typeof module.durationMinutes === "number" ? module.durationMinutes : 0)
  }, 0)

  const moduleCountLabel = moduleCount > 0 ? `${moduleCount} ${moduleCount === 1 ? "Module" : "Modules"}` : ""
  const durationLabel = totalDuration > 0 ? formatTotalDuration(totalDuration) : ""
  const heroSubtitle = [moduleCountLabel, durationLabel].filter(Boolean).join(" • ")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{c.title}</h1>
            {heroSubtitle ? <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground/80">{heroSubtitle}</p> : null}
          </div>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">{description}</p>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="flex flex-col items-start gap-2 lg:items-end">
            {wizardError ? <p className="max-w-xs text-right text-xs text-rose-500">{wizardError}</p> : null}
            <div className="flex items-center gap-2">
              <form action={createModuleAction} className="contents">
                <input type="hidden" name="classId" value={c.id} />
                <Button type="submit" variant="outline" size="sm">
                  Add module
                </Button>
              </form>
              <Button variant="outline" size="sm" onClick={handleEditClass} disabled={wizardLoading}>
                {wizardLoading ? "Loading…" : "Edit class"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.modules.map((m, index) => {
          const moduleIndex = m.idx ?? index + 1
          const viewHref = c.slug ? `/class/${c.slug}/module/${moduleIndex}` : null
          const lockedForLearners = Boolean(m.locked)
          const locked = isAdmin ? false : lockedForLearners
          const status = lockedForLearners ? "locked" : m.status ?? "not_started"
          const completed = status === "completed"
          const inProgress = status === "in_progress"
          const progress = Math.max(0, Math.min(100, typeof m.progressPercent === "number" ? m.progressPercent : completed ? 100 : inProgress ? 50 : 0))
          const statusDisplay = getStatusDisplay(status, lockedForLearners, isAdmin)

          const ctaLabel = locked
            ? "Complete previous modules"
            : completed
              ? "Review module"
              : inProgress
                ? "Continue learning"
                : "Start module"

          return (
            <Card
              key={m.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm transition hover:shadow-md",
                locked ? "opacity-80" : ""
              )}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <IconNotebook className="h-6 w-6 shrink-0" aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-lg font-semibold leading-tight truncate" title={m.title}>
                        {m.title}
                      </h3>
                      {m.subtitle ? (
                        <p
                          className="text-sm text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis"
                          title={m.subtitle}
                        >
                          {m.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <Badge className={cn("gap-1 whitespace-nowrap", statusDisplay.className)} variant="outline">
                      <statusDisplay.icon className="h-3.5 w-3.5" />
                      {statusDisplay.label}
                    </Badge>
                    {isAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/modules/${m.id}`}>Edit module</Link>
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
                            <input type="hidden" name="moduleId" value={m.id} />
                            <input type="hidden" name="classId" value={c.id} />
                            <DropdownMenuItem asChild>
                              <button type="submit" className="w-full text-left">
                                Delete module
                              </button>
                            </DropdownMenuItem>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 overflow-hidden rounded-full" />
                </div>

                <div>
                  {isAdmin ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {viewHref ? (
                        <Button asChild size="sm" className="flex-1">
                          <Link href={viewHref}>Preview module</Link>
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1" onClick={() => onStartModule?.(m.id)}>
                          Preview module
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/admin/modules/${m.id}`}>Edit module</Link>
                      </Button>
                    </div>
                  ) : viewHref ? (
                    <Button
                      asChild
                      disabled={locked}
                      className={cn(
                        "w-full",
                        locked ? "bg-muted text-muted-foreground hover:bg-muted" : ""
                      )}
                    >
                      <Link href={viewHref}>{ctaLabel}</Link>
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        locked ? "bg-muted text-muted-foreground hover:bg-muted" : ""
                      )}
                      onClick={() => {
                        if (!locked) onStartModule?.(m.id)
                      }}
                      disabled={locked}
                    >
                      {ctaLabel}
                    </Button>
                  )}
                  {isAdmin && lockedForLearners ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Locked for learners until previous modules are completed.
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {isAdmin ? (
        <LessonCreationWizard
          open={wizardOpen}
          mode="edit"
          classId={c.id}
          initialPayload={wizardPayload}
          onOpenChange={(value) => {
            setWizardOpen(value)
            if (!value) {
              setWizardPayload(null)
            }
          }}
          onSubmit={updateClassWizardAction}
        />
      ) : null}
    </div>
  )
}

function formatTotalDuration(totalMinutes: number) {
  const minutes = Math.round(totalMinutes)
  if (minutes <= 0) return ""
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hr" : "hrs"}`)
  }
  if (remainder > 0) {
    parts.push(`${remainder} min`)
  }
  return parts.join(" ")
}

function getStatusDisplay(
  status: "not_started" | "in_progress" | "completed" | "locked",
  lockedForLearners: boolean,
  isAdmin: boolean
) {
  if (isAdmin && lockedForLearners) {
    return {
      label: "Locked for learners",
      icon: IconLock,
      className: "bg-muted text-muted-foreground",
    }
  }
  if (status === "completed") {
    return {
      label: "Completed",
      icon: IconCircleCheck,
      className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    }
  }
  if (status === "in_progress") {
    return {
      label: "In progress",
      icon: IconPlayerPlay,
      className: "bg-primary/10 text-primary",
    }
  }
  if (status === "locked") {
    return {
      label: "Locked",
      icon: IconLock,
      className: "bg-muted text-muted-foreground",
    }
  }
  return {
    label: "Not started",
    icon: IconPlayerPlay,
    className: "bg-muted text-muted-foreground",
  }
}
