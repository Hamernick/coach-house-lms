import { TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { AssignmentSection } from "../assignment-sections"
import { TabStepBadge, type TabStepStatus } from "./tab-step-badge"

type AssignmentInlineTabsProps = {
  tabSections: AssignmentSection[]
  inlineActiveIndex: number
}

function resolveTabStatus(index: number, inlineActiveIndex: number): TabStepStatus {
  if (inlineActiveIndex === -1) return "not_started"
  if (index < inlineActiveIndex) return "complete"
  if (index === inlineActiveIndex) return "in_progress"
  return "not_started"
}

export function AssignmentInlineTabs({ tabSections, inlineActiveIndex }: AssignmentInlineTabsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="w-full flex-1 flex-wrap items-end gap-6 border-b border-border/60 bg-transparent p-0 pb-2">
          {tabSections.map((section, index) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="flex items-center gap-2 border-b-2 border-transparent pb-2 text-sm font-semibold text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
            >
              <TabStepBadge status={resolveTabStatus(index, inlineActiveIndex)} label={index + 1} />
              <span>{section.title ?? "Step"}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </div>
  )
}
