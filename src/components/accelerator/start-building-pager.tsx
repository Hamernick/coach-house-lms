"use client"

import { useRouter } from "next/navigation"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import Lock from "lucide-react/dist/esm/icons/lock"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { cn } from "@/lib/utils"

export type ModuleCardStatus = "locked" | "not_started" | "in_progress" | "completed"

export type ModuleCard = {
  id: string
  title: string
  description: string | null
  href: string
  status: ModuleCardStatus
  index: number
}

export type ModuleGroup = {
  id: string
  title: string
  description: string | null
  modules: ModuleCard[]
}

type StartBuildingPagerProps = {
  groups: ModuleGroup[]
}

export function StartBuildingPager({ groups }: StartBuildingPagerProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Continue building</p>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.id} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{group.title}</p>
                {group.description ? (
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.modules.map((module) => (
                <StartBuildingCard
                  key={module.id}
                  module={module}
                  onNavigate={() => {
                    if (module.status === "locked") return
                    router.push(module.href)
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function StartBuildingCard({ module, onNavigate }: { module: ModuleCard; onNavigate: () => void }) {
  const locked = module.status === "locked"
  const inProgress = module.status === "in_progress"
  const completed = module.status === "completed"

  const statusLabel = locked ? "Locked" : completed ? "Completed" : inProgress ? "In progress" : "Not started"
  const ctaLabel = locked ? "Locked" : completed ? "Review" : inProgress ? "Continue" : "Start"

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (locked) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onNavigate()
        }
      }}
      className={cn(
        "group flex min-h-[220px] flex-col rounded-[26px] border border-border/60 bg-card/70 p-4 text-left shadow-sm transition-transform duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        locked && "cursor-not-allowed opacity-70 hover:shadow-sm",
      )}
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-[22px] shadow-sm">
        <NewsGradientThumb seed={`module-${module.id}`} className="absolute inset-0" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
          Module {module.index}
        </span>
        <span
          className={cn(
            "absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
            "border-border/60 bg-background/70",
            inProgress && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            completed && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          )}
        >
          {locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : null}
          {completed ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
          <span>{statusLabel}</span>
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] uppercase text-muted-foreground">{ctaLabel}</p>
        <p className="text-sm font-semibold text-foreground">{module.title}</p>
        {module.description ? (
          <p className="text-xs text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
            {module.description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
