import { motion } from "framer-motion"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import type { MutableRefObject } from "react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { ModuleAssignmentField } from "../../types"
import type { AssignmentSection } from "../assignment-sections"

type AssignmentProgressPanelProps = {
  overall: { total: number; answered: number; percent: number }
  useInlineTabs: boolean
  activeSection: string
  onActiveSectionChange: (section: string) => void
  tabSections: AssignmentSection[]
  fieldAnswered: (field: ModuleAssignmentField) => boolean
  tabRefs: MutableRefObject<(HTMLButtonElement | null)[]>
  indicator: { top: number; height: number }
}

export function AssignmentProgressPanel({
  overall,
  useInlineTabs,
  activeSection,
  onActiveSectionChange,
  tabSections,
  fieldAnswered,
  tabRefs,
  indicator,
}: AssignmentProgressPanelProps) {
  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card/70 px-4 pb-4 pt-3 self-start overflow-hidden">
      <div className="border-b border-border/60 px-0 pb-2 pt-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Progress
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${overall.percent}%` }}
            aria-label={`Progress ${overall.percent}%`}
          />
        </div>
      </div>
      <div className="pt-3">
        <Badge
          variant="secondary"
          className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
        >
          {overall.answered} of {overall.total} completed
        </Badge>
      </div>
      {!useInlineTabs ? (
        <Tabs
          value={activeSection}
          onValueChange={onActiveSectionChange}
          className="flex flex-col gap-3"
        >
          <TabsList className="relative flex w-full flex-col items-stretch gap-2 bg-transparent p-0 pl-2.5 pr-0 pt-3">
            {tabSections.map((section, idx) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                ref={(el) => {
                  tabRefs.current[idx] = el
                }}
                className="relative z-10 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted-foreground transition hover:bg-accent/60 data-[state=active]:bg-accent/70 data-[state=active]:text-foreground"
              >
                <span className="min-w-0 flex-1 whitespace-normal break-words select-text pr-2 text-sm leading-snug">
                  {section.title ?? `Step ${idx + 1}`}
                </span>
                {(() => {
                  const total = section.fields.length
                  const answered = section.fields.reduce(
                    (acc, field) => acc + (fieldAnswered(field) ? 1 : 0),
                    0,
                  )
                  const complete = total > 0 && answered === total
                  const inProgress = answered > 0 && !complete
                  const badgeClass = complete
                    ? "text-emerald-500"
                    : inProgress
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  return complete ? (
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-500"
                      aria-label="Complete"
                    />
                  ) : (
                    <span
                      className={`shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-semibold leading-none ${badgeClass}`}
                    >
                      {answered} of {total || 0}
                    </span>
                  )
                })()}
              </TabsTrigger>
            ))}
            <motion.div
              className="bg-primary absolute left-0.5 top-2 z-0 w-0.5 rounded-full"
              layout
              style={{ top: indicator.top + 2, height: Math.max(0, indicator.height - 4) }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  )
}
