import { Tabs, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { AssignmentSection } from "../assignment-sections"
import { AssignmentField } from "./assignment-field"
import { AssignmentInlineTabs } from "./assignment-inline-tabs"
import type { AssignmentFieldRenderContext } from "./types"

const NARROW_STEPPER_FIELD_TYPES = new Set([
  "select",
  "short_text",
  "multi_select",
  "slider",
])

type AssignmentFieldsContentProps = {
  isStepper: boolean
  shouldUseTabs: boolean
  useInlineTabs: boolean
  baseSections: AssignmentSection[]
  tabSections: AssignmentSection[]
  activeSection: string
  activeSectionKey: string
  onActiveSectionChange: (section: string) => void
  inlineActiveIndex: number
  fieldContext: AssignmentFieldRenderContext
}

export function AssignmentFieldsContent({
  isStepper,
  shouldUseTabs,
  useInlineTabs,
  baseSections,
  tabSections,
  activeSection,
  activeSectionKey,
  onActiveSectionChange,
  inlineActiveIndex,
  fieldContext,
}: AssignmentFieldsContentProps) {
  if (isStepper) {
    const focusedSection =
      tabSections.find((section) => section.id === activeSectionKey) ?? tabSections[0]

    if (!focusedSection) return null

    const singleFieldType = focusedSection.fields[0]?.type
    const useCompactStepperWidth = focusedSection.fields.every(
      (field) =>
        field.type !== "long_text" &&
        field.type !== "budget_table" &&
        field.type !== "custom_program",
    )
    const useNarrowStepperWidth =
      focusedSection.fields.length > 0 &&
      focusedSection.fields.length <= 2 &&
      focusedSection.fields.every((field) =>
        NARROW_STEPPER_FIELD_TYPES.has(field.type),
      )
    const stretchSingleField =
      focusedSection.fields.length === 1 &&
      (singleFieldType === "long_text" || singleFieldType === "budget_table")

    return (
      <div
        className={cn(
          "w-full space-y-4",
          useNarrowStepperWidth
            ? "mx-auto max-w-[30rem]"
            : useCompactStepperWidth
              ? "mx-auto max-w-[36rem]"
              : "",
          stretchSingleField && "flex h-full min-h-0 flex-1 flex-col",
        )}
      >
        {focusedSection.fields.map((field) => (
          <div key={field.name} className={cn(stretchSingleField && "min-h-0 flex-1")}>
            <AssignmentField field={field} {...fieldContext} />
          </div>
        ))}
      </div>
    )
  }

  if (shouldUseTabs) {
    return (
      <Tabs value={activeSection} onValueChange={onActiveSectionChange} className="w-full">
        {useInlineTabs ? (
          <AssignmentInlineTabs tabSections={tabSections} inlineActiveIndex={inlineActiveIndex} />
        ) : null}
        {tabSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-5 pb-24">
            <div className="space-y-5">
              {section.fields.map((field) => (
                <AssignmentField
                  key={field.name}
                  field={field}
                  {...fieldContext}
                  options={useInlineTabs ? { hideLabel: true } : undefined}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <div className="space-y-10 max-h-[calc(100vh-240px)] overflow-y-auto pr-1 scroll-smooth snap-y snap-mandatory">
      {baseSections.map((section, sectionIndex) => (
        <div key={section.id ?? `section-${sectionIndex}`} className="snap-start scroll-mt-6 pb-[22vh] pt-2">
          <div className="space-y-6">
            {section.fields.map((field) => (
              <AssignmentField key={field.name} field={field} {...fieldContext} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
