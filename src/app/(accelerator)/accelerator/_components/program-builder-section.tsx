import { Empty } from "@/components/ui/empty"
import { ProgramCard } from "@/components/programs/program-card"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { PROGRAM_TEMPLATES } from "../_lib/overview-helpers"

export function ProgramBuilderSection() {
  return (
    <section id="roadmap" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Program builder</p>
          <span className="text-xs text-muted-foreground">Templates stay private until published.</span>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        <div className="snap-start shrink-0 w-[min(380px,85vw)] min-h-[480px]">
          <Empty
            className="h-full rounded-3xl border-2 border-dashed border-border/60 bg-surface dark:bg-card/40"
            title="Create your first program"
            description="Start from scratch or customize a template to reflect real staffing, outcomes, and funding needs."
            actions={<ProgramWizardLazy triggerLabel="Create program" />}
            size="sm"
            variant="subtle"
          />
        </div>
        {PROGRAM_TEMPLATES.map((template) => (
          <div
            key={template.title}
            className="snap-start shrink-0 w-[min(380px,85vw)] min-h-[480px]"
          >
            <ProgramCard
              title={template.title}
              location={template.location}
              statusLabel="Template"
              chips={template.chips}
              ctaLabel="View template"
              ctaHref="/organization?tab=programs"
              ctaTarget="_self"
              patternId={template.patternId}
              variant="medium"
              className="h-full bg-surface dark:bg-card"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
