"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import FolderPlusIcon from "lucide-react/dist/esm/icons/folder-plus"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import { useTransition } from "react"

import { seedNextDemoProgramAction } from "@/actions/programs"
import { seedDemoWorkspaceAction } from "@/actions/demo-workspace"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty } from "@/components/ui/empty"
import type { OrgProgram } from "@/components/organization/org-profile-card/types"
import { dateRangeChip, locationSummary } from "@/components/organization/org-profile-card/utils"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

type ProgramBuilderDashboardCardProps = {
  programs: OrgProgram[]
  className?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function formatMoney(cents: number | null | undefined) {
  const dollars = typeof cents === "number" && Number.isFinite(cents) ? cents / 100 : 0
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, dollars))
}

function parseProgramType(program: OrgProgram) {
  if (!isRecord(program.wizard_snapshot)) return null
  const value = program.wizard_snapshot.programType
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function parseCoreFormat(program: OrgProgram) {
  if (!isRecord(program.wizard_snapshot)) return null
  const value = program.wizard_snapshot.coreFormat
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function parseOutcomes(program: OrgProgram) {
  if (!isRecord(program.wizard_snapshot)) return []
  const raw = program.wizard_snapshot.successOutcomes
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
    .slice(0, 3)
}

function parseProgramChips(program: OrgProgram): string[] {
  const chips = [
    dateRangeChip(program.start_date, program.end_date) || program.duration_label || null,
    parseCoreFormat(program),
    parseProgramType(program),
  ]
  return chips.filter((value): value is string => Boolean(value && value.trim()))
}

export function ProgramBuilderDashboardCard({ programs, className }: ProgramBuilderDashboardCardProps) {
  const router = useRouter()
  const [seedPending, startSeedTransition] = useTransition()
  const [seedWorkspacePending, startSeedWorkspaceTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<OrgProgram | null>(null)
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null)

  const sortedPrograms = useMemo(
    () =>
      [...programs].sort((a, b) => {
        const left = a.created_at ? Date.parse(a.created_at) : 0
        const right = b.created_at ? Date.parse(b.created_at) : 0
        return right - left
      }),
    [programs],
  )

  useEffect(() => {
    if (sortedPrograms.length === 0) {
      setActiveProgramId(null)
      return
    }
    if (!activeProgramId || !sortedPrograms.some((program) => program.id === activeProgramId)) {
      setActiveProgramId(sortedPrograms[0].id)
    }
  }, [activeProgramId, sortedPrograms])

  const activeProgram = useMemo(
    () => sortedPrograms.find((program) => program.id === activeProgramId) ?? sortedPrograms[0] ?? null,
    [activeProgramId, sortedPrograms],
  )

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open)
    if (!open) {
      router.refresh()
    }
  }

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open)
    if (!open) {
      setSelectedProgram(null)
      router.refresh()
    }
  }

  return (
    <>
      <Card className={cn("min-w-0 overflow-hidden", className)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardListIcon className="h-4 w-4" aria-hidden />
                Programs
              </CardTitle>
              <CardDescription>
                Create, review, and iterate programs from one workspace.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={seedWorkspacePending}
                onClick={() => {
                  startSeedWorkspaceTransition(async () => {
                    const result = await seedDemoWorkspaceAction()
                    if ("error" in result) {
                      toast.error(result.error)
                      return
                    }
                    toast.success(
                      `Workspace seeded: +${result.seededPrograms} programs, +${result.seededTeam} team, +${result.seededCalendarEvents} events, +${result.seededProgressRows} progress rows.`,
                    )
                    router.refresh()
                  })
                }}
              >
                <SparklesIcon className="h-4 w-4" aria-hidden />
                {seedWorkspacePending ? "Seeding workspace..." : "Seed demo workspace"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={seedPending}
                onClick={() => {
                  startSeedTransition(async () => {
                    const result = await seedNextDemoProgramAction()
                    if ("error" in result) {
                      toast.error(result.error)
                      return
                    }
                    toast.success(
                      `Seeded ${result.statusLabel}. ${result.remaining} demo stage${result.remaining === 1 ? "" : "s"} left.`,
                    )
                    router.refresh()
                  })
                }}
              >
                <SparklesIcon className="h-4 w-4" aria-hidden />
                {seedPending ? "Seeding..." : "Seed next stage"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9"
                onClick={() => {
                  setCreateOpen(true)
                }}
              >
                <FolderPlusIcon className="h-4 w-4" aria-hidden />
                New program
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          {sortedPrograms.length === 0 ? (
            <Empty
              className="rounded-xl"
              size="sm"
              title="No programs to display"
              description="Programs you create will appear here."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setCreateOpen(true)
                  }}
                >
                  Start program builder
                </Button>
              }
            />
          ) : (
            <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background/20">
                {sortedPrograms.map((program, index) => {
                  const displayTitle = program.title?.trim() || "Untitled program"
                  const displayType = parseProgramType(program)
                  const statusLabel = program.status_label?.trim() || "Draft"
                  const budget = formatMoney(program.goal_cents)
                  const active = activeProgram?.id === program.id
                  return (
                    <button
                      key={program.id}
                      type="button"
                      className={cn(
                        "w-full px-3 py-2.5 text-left transition",
                        index > 0 && "border-t border-border/60",
                        active ? "bg-muted/40" : "hover:bg-muted/30",
                      )}
                      onClick={() => setActiveProgramId(program.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{displayTitle}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {displayType ? `${displayType} · ` : ""}
                            Budget {budget}
                          </p>
                        </div>
                        <Badge
                          variant={active ? "default" : "secondary"}
                          className="shrink-0 whitespace-nowrap rounded-full text-[10px]"
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>

              {activeProgram ? (
                <div className="min-w-0 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {activeProgram.title?.trim() || "Untitled program"}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {locationSummary(activeProgram) || "Location pending"}
                      </p>
                    </div>
                    <Badge className="shrink-0 rounded-full text-[10px]">
                      {activeProgram.status_label?.trim() || "Draft"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parseProgramChips(activeProgram).map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <dl className="mt-4 divide-y divide-border/50 rounded-lg border border-border/60 bg-background/20 text-sm">
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">Budget</dt>
                      <dd className="font-medium tabular-nums">{formatMoney(activeProgram.goal_cents)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">Raised</dt>
                      <dd className="font-medium tabular-nums">{formatMoney(activeProgram.raised_cents)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">Outcomes</dt>
                      <dd className="font-medium tabular-nums">{parseOutcomes(activeProgram).length}</dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Outcomes snapshot</p>
                    {parseOutcomes(activeProgram).length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm">
                        {parseOutcomes(activeProgram).map((outcome) => (
                          <li key={outcome}>- {outcome}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add outcomes in Program Builder Step 3.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setSelectedProgram(activeProgram)
                        setEditOpen(true)
                      }}
                    >
                      Edit brief
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/my-organization?view=editor&tab=programs&programId=${encodeURIComponent(activeProgram.id)}`}>
                        Open full view
                        <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramWizardLazy mode="create" open={createOpen} onOpenChange={handleCreateOpenChange} />
      {selectedProgram ? (
        <ProgramWizardLazy
          mode="edit"
          program={selectedProgram}
          open={editOpen}
          onOpenChange={handleEditOpenChange}
        />
      ) : null}
    </>
  )
}
