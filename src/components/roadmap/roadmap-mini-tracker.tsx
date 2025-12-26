import { cn } from "@/lib/utils"
import type { RoadmapSection } from "@/lib/roadmap"

type RoadmapMiniTrackerProps = {
  sections: RoadmapSection[]
}

export function RoadmapMiniTracker({ sections }: RoadmapMiniTrackerProps) {
  const total = sections.length
  const completed = sections.filter((s) => s.content.trim().length > 0 && s.isPublic).length
  const nextUp = sections.find((s) => !s.content.trim()) ?? sections.find((s) => !s.isPublic)
  const nextId = nextUp?.id

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Roadmap tracker</p>
          <p className="text-xs text-muted-foreground">
            {completed}/{total} sections published{nextUp ? ` · Next: ${nextUp.title}` : ""}
          </p>
        </div>
      </div>

      {/* Compact vertical list on small screens */}
      <div className="grid gap-3 md:hidden">
        {sections.map((section, idx) => {
          const hasContent = section.content.trim().length > 0
          const isNext = nextId === section.id
          return (
            <div
              key={section.id}
              className={cn(
                "rounded-xl border bg-background/70 p-3",
                isNext ? "border-primary/70 shadow-sm" : "border-border/70",
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-1 text-[11px]">Step {idx + 1}</span>
                {isNext ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">Next</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{section.title}</p>
            </div>
          )
        })}
      </div>

      {/* Grid tracker on medium+ screens */}
      <div className="hidden md:block">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {sections.map((section, idx) => {
            const isFilled = section.content.trim().length > 0
            const colors =
              isFilled && section.isPublic
                ? "bg-emerald-500 border-emerald-500"
                : isFilled
                  ? "bg-amber-500 border-amber-500"
                  : "bg-muted border-border"
            const isNext = nextId === section.id

            return (
              <div
                key={section.id}
                className={cn(
                  "flex min-w-0 flex-col justify-between gap-4 rounded-xl border bg-background/70 px-3 py-3",
                  isNext ? "border-primary/70 shadow-sm" : "border-border/60",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold text-background",
                      colors,
                    )}
                  >
                    {idx + 1}
                  </div>
                  {isNext ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Next
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-foreground">{section.title}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
