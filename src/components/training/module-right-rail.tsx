"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import NotebookPenIcon from "lucide-react/dist/esm/icons/notebook-pen"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import CalendarCheckIcon from "lucide-react/dist/esm/icons/calendar-check"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import HomeIcon from "lucide-react/dist/esm/icons/home"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ResourcesCard } from "@/components/training/resources-card"
import { DeckResourceCard } from "@/components/training/deck-resource-card"
import type { ModuleResource } from "@/components/training/types"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import { useModuleNotes } from "@/hooks/use-module-notes"
import type { CoachingTier } from "@/lib/meetings"
import { cn } from "@/lib/utils"

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

type ToolKey = "notes" | "resources" | "coach" | "ai"

type ModuleRightRailProps = {
  moduleId: string
  resources: ModuleResource[]
  breakHref: string
  hasDeck: boolean
}

export function ModuleRightRail({ moduleId, resources, breakHref, hasDeck }: ModuleRightRailProps) {
  const [activeTool, setActiveTool] = useState<ToolKey>("notes")
  const normalizedResources = useMemo(() => (Array.isArray(resources) ? resources : []), [resources])

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="space-y-3">
        {activeTool === "notes" ? <ModuleNotesPanel moduleId={moduleId} /> : null}
        {activeTool === "resources" ? (
          <ModuleResourcesPanel resources={normalizedResources} moduleId={moduleId} hasDeck={hasDeck} />
        ) : null}
        {activeTool === "coach" ? <ModuleCoachPanel /> : null}
        {activeTool === "ai" ? <ModuleAiPanel /> : null}
      </div>
      <ModuleToolTray activeTool={activeTool} onToolChange={setActiveTool} breakHref={breakHref} />
    </div>
  )
}

function ModuleNotesPanel({ moduleId }: { moduleId: string }) {
  const { value, setValue, saveNow, isSaving } = useModuleNotes(moduleId)

  return (
    <Card className="rounded-2xl border-border/60 bg-muted/10 shadow-none">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">Notes</CardTitle>
        {isSaving ? (
          <CardDescription className="text-xs text-muted-foreground">Saving…</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Textarea
          name={`module-notes-${moduleId}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => {
            void saveNow()
          }}
          placeholder="Capture key ideas, quotes, or next steps…"
          className="min-h-[180px] resize-none text-sm"
          spellCheck
          autoComplete="off"
        />
      </CardContent>
    </Card>
  )
}

function ModuleResourcesPanel({
  resources,
  moduleId,
  hasDeck,
}: {
  resources: ModuleResource[]
  moduleId: string
  hasDeck: boolean
}) {
  return (
    <Card className="rounded-2xl border-border/60 bg-muted/10 shadow-none">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">Resources</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          References and links tied to this module.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <ResourcesCard resources={resources} variant="stacked">
          <DeckResourceCard moduleId={moduleId} hasDeck={hasDeck} variant="stacked" />
        </ResourcesCard>
      </CardContent>
    </Card>
  )
}

function ModuleCoachPanel() {
  const { schedule, pending } = useCoachingBooking()
  const [tier, setTier] = useState<CoachingTier | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleSchedule = async () => {
    const payload = await schedule()
    if (payload?.tier) {
      setTier(payload.tier)
    }
    if (payload?.remaining === null || typeof payload?.remaining === "number") {
      setRemaining(payload?.remaining ?? null)
    }
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-muted/10 shadow-none">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">Coach Review</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Book time to review this module with a coach.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
          <CoachingAvatarGroup size="sm" />
        </div>
        <Button type="button" size="sm" onClick={handleSchedule} disabled={pending} className="w-full">
          {pending ? "Opening…" : "Schedule a session"}
        </Button>
        {tier === "free" && typeof remaining === "number" && remaining > 0 ? (
          <p className="text-xs text-muted-foreground">
            {remaining} included session{remaining === 1 ? "" : "s"} remaining.
          </p>
        ) : null}
        {tier === "free" && remaining === 0 ? (
          <p className="text-xs text-muted-foreground">
            Included sessions complete. Your next bookings use the discounted calendar.
          </p>
        ) : null}
        {tier === "discounted" ? (
          <p className="text-xs text-muted-foreground">
            Included sessions complete. You are now booking at the discounted coaching rate.
          </p>
        ) : null}
        {tier === "full" ? (
          <p className="text-xs text-muted-foreground">Coaching booking opened in a new tab.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ModuleAiPanel() {
  return (
    <Card className="rounded-2xl border-border/60 bg-muted/10 shadow-none">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">AI Coach</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Draft answers, summarize notes, and refine your thinking.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Button asChild size="sm" variant="secondary" className="w-full">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=AI%20Coach%20Access`}>Request access</a>
        </Button>
      </CardContent>
    </Card>
  )
}

function ModuleToolTray({
  activeTool,
  onToolChange,
  breakHref,
}: {
  activeTool: ToolKey
  onToolChange: (tool: ToolKey) => void
  breakHref: string
}) {
  return (
    <div className="sticky bottom-0 mt-auto space-y-2 rounded-2xl border border-border/60 bg-background/90 p-2 shadow-sm backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <ToolTrayButton
          icon={NotebookPenIcon}
          label="Notes"
          isActive={activeTool === "notes"}
          onClick={() => onToolChange("notes")}
        />
        <ToolTrayButton
          icon={FolderOpenIcon}
          label="Resources"
          isActive={activeTool === "resources"}
          onClick={() => onToolChange("resources")}
        />
        <ToolTrayButton
          icon={CalendarCheckIcon}
          label="Coach"
          isActive={activeTool === "coach"}
          onClick={() => onToolChange("coach")}
        />
        <ToolTrayButton
          icon={SparklesIcon}
          label="AI"
          isActive={activeTool === "ai"}
          onClick={() => onToolChange("ai")}
        />
      </div>
      <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
        <Link href={breakHref}>
          <HomeIcon className="h-4 w-4" aria-hidden />
          Return home
        </Link>
      </Button>
    </div>
  )
}

function ToolTrayButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: typeof NotebookPenIcon
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "group flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/60 text-sm font-medium transition-colors",
        "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "touch-manipulation",
        isActive && "bg-foreground/5 text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="text-xs tracking-tight">{label}</span>
    </button>
  )
}
