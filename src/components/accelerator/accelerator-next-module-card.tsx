import Link from "next/link"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ModuleCard } from "@/lib/accelerator/progress"
import { cn } from "@/lib/utils"

export function AcceleratorNextModuleCard({ module }: { module: ModuleCard | null }) {
  if (!module) {
    return (
      <Card className="flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-[26px] border border-border/60 shadow-sm">
        <CardContent className="flex h-full flex-col gap-0 p-0 first:pt-0">
          <div className="relative flex-1 min-h-[220px] overflow-hidden rounded-[22px] shadow-sm mx-[5px] mt-[5px] mb-4">
            <NewsGradientThumb seed="accelerator-next-module" className="absolute inset-0" />
          </div>
          <div className="space-y-2 px-4 pb-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">All modules complete</p>
              <p className="text-xs text-muted-foreground">You are fully caught up. Revisit any module below.</p>
            </div>
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="secondary" disabled>
                Complete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const inProgress = module.status === "in_progress"
  const completed = module.status === "completed"
  const statusLabel = completed ? "Completed" : inProgress ? "In progress" : "Not started"
  const ctaLabel = completed ? "Review" : inProgress ? "Continue" : "Start"

  return (
    <Card
      className={cn(
        "group flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-[26px] border border-border/60 shadow-sm",
        "transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
    >
      <CardContent className="flex h-full flex-col gap-0 p-0 first:pt-0">
        <div className="relative flex-1 min-h-[220px] overflow-hidden rounded-[22px] shadow-sm mx-[5px] mt-[5px] mb-4">
          <NewsGradientThumb seed={`module-${module.id}`} className="absolute inset-0" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
            Module {module.index}
          </span>
          <span
            className={cn(
              "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm",
              inProgress &&
                "border-amber-300 bg-amber-50/95 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200",
              completed && "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-200",
            )}
          >
            {completed ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
            <span>{statusLabel}</span>
          </span>
          <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition group-hover:bg-background">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>

        <div className="space-y-2 px-4 pb-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{module.title}</p>
            {module.description ? (
              <p className="text-xs text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
                {module.description}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Button asChild size="sm" variant="secondary">
              <Link href={module.href}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
