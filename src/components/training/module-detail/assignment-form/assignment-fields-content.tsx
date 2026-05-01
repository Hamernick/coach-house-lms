import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import FileText from "lucide-react/dist/esm/icons/file-text"
import Presentation from "lucide-react/dist/esm/icons/presentation"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FieldDescription, FieldGroup } from "@/components/ui/field"
import { cn } from "@/lib/utils"

import type { AssignmentSection } from "../assignment-sections"
import type { ModuleResource } from "../../types"
import { AssignmentField } from "./assignment-field"
import { AssignmentInlineTabs } from "./assignment-inline-tabs"
import type { AssignmentFieldRenderContext } from "./types"

const NARROW_STEPPER_FIELD_TYPES = new Set([
  "select",
  "short_text",
  "multi_select",
  "slider",
])

function AssignmentInfoScreen({
  hasDeck,
  moduleId,
  resources,
  section,
}: {
  hasDeck: boolean
  moduleId: string
  resources: ModuleResource[]
  section: AssignmentSection
}) {
  const infoBlocks = section.infoBlocks ?? []
  const introBlocks = infoBlocks.slice(0, 2)
  const sectionBlocks = infoBlocks.slice(2)
  const hasResources = resources.length > 0 || hasDeck

  if (infoBlocks.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-[42rem] flex-col gap-4 text-left">
        {section.title ? (
          <h3 className="text-xl font-semibold leading-tight text-foreground text-balance">
            {section.title}
          </h3>
        ) : null}
        {section.description ? (
          <FieldDescription className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {section.description}
          </FieldDescription>
        ) : null}
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[56rem] space-y-6 text-left sm:space-y-8 lg:space-y-10">
      <div className="space-y-1.5 sm:space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Lesson guide
        </p>
        <h3 className="text-xl font-semibold leading-tight text-foreground text-balance sm:text-2xl">
          {section.title ?? "Overview"}
        </h3>
        {section.description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {section.description}
          </p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:gap-10">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          {introBlocks.map((block, index) => (
            <section key={`${block.title ?? "intro"}-${index}`} className="space-y-2.5 sm:space-y-3">
              {block.title ? (
                <h4 className="text-sm font-semibold leading-6 text-foreground sm:text-base">
                  {block.title}
                </h4>
              ) : null}
              {block.description ? (
                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground sm:leading-7">
                  {block.description}
                </p>
              ) : null}
            </section>
          ))}
        </div>

        <aside className="min-w-0 space-y-6 sm:space-y-8">
          {sectionBlocks.length > 0 ? (
            <section className="space-y-2.5 sm:space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Question path</h4>
              <div className="space-y-2.5 sm:space-y-3">
                {sectionBlocks.map((block, index) => (
                  <div key={`${block.title ?? "section"}-${index}`} className="space-y-1.5 border-l border-border/70 pl-3 sm:pl-4">
                    {block.title ? (
                      <p className="text-sm font-medium leading-5 text-foreground">
                        {block.title}
                      </p>
                    ) : null}
                    {block.description ? (
                      <p className="text-xs leading-5 text-muted-foreground">
                        {block.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasResources ? (
            <section className="space-y-2.5 sm:space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Resources</h4>
              <div className="space-y-2">
                {hasDeck ? (
                  <Button asChild variant="outline" className="h-auto min-h-11 w-full justify-start gap-2.5 px-3 py-2.5 text-left sm:gap-3">
                    <a href={`/api/modules/${moduleId}/deck`} target="_blank" rel="noopener noreferrer">
                      <Presentation className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">Lesson deck</span>
                        <span className="block text-xs text-muted-foreground">Open deck materials</span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </a>
                  </Button>
                ) : null}
                {resources.map((resource, index) => (
                  <Button
                    key={`${resource.url}-${index}`}
                    asChild
                    variant="outline"
                    className="h-auto min-h-11 w-full justify-start gap-2.5 px-3 py-2.5 text-left sm:gap-3"
                  >
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {resource.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {resource.provider}
                        </span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </a>
                  </Button>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

type AssignmentFieldsContentProps = {
  isStepper: boolean
  shouldUseTabs: boolean
  useInlineTabs: boolean
  baseSections: AssignmentSection[]
  tabSections: AssignmentSection[]
  activeSection: string
  activeSectionKey: string
  hasDeck: boolean
  moduleId: string
  onActiveSectionChange: (section: string) => void
  resources: ModuleResource[]
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
  hasDeck,
  moduleId,
  onActiveSectionChange,
  resources,
  inlineActiveIndex,
  fieldContext,
}: AssignmentFieldsContentProps) {
  if (isStepper) {
    const focusedSection =
      tabSections.find((section) => section.id === activeSectionKey) ?? tabSections[0]

    if (!focusedSection) return null

    if (focusedSection.fields.length === 0) {
      return (
        <AssignmentInfoScreen
          hasDeck={hasDeck}
          moduleId={moduleId}
          resources={resources}
          section={focusedSection}
        />
      )
    }

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
      <FieldGroup
        className={cn(
          "w-full gap-4",
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
      </FieldGroup>
    )
  }

  if (shouldUseTabs) {
    return (
      <Tabs value={activeSection} onValueChange={onActiveSectionChange} className="w-full">
        {useInlineTabs ? (
          <AssignmentInlineTabs tabSections={tabSections} inlineActiveIndex={inlineActiveIndex} />
        ) : null}
        {tabSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="pb-24">
            {section.fields.length === 0 ? (
              <AssignmentInfoScreen
                hasDeck={hasDeck}
                moduleId={moduleId}
                resources={resources}
                section={section}
              />
            ) : (
              <FieldGroup className="gap-5">
                {section.fields.map((field) => (
                  <AssignmentField
                    key={field.name}
                    field={field}
                    {...fieldContext}
                    options={useInlineTabs ? { hideLabel: true } : undefined}
                  />
                ))}
              </FieldGroup>
            )}
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <div className="flex max-h-[calc(100vh-240px)] flex-col gap-10 overflow-y-auto pr-1 scroll-smooth snap-y snap-mandatory">
      {baseSections.map((section, sectionIndex) => (
        <div key={section.id ?? `section-${sectionIndex}`} className="snap-start scroll-mt-6 pb-[22vh] pt-2">
          {section.fields.length === 0 ? (
            <AssignmentInfoScreen
              hasDeck={hasDeck}
              moduleId={moduleId}
              resources={resources}
              section={section}
            />
          ) : (
            <FieldGroup className="gap-6">
              {section.fields.map((field) => (
                <AssignmentField key={field.name} field={field} {...fieldContext} />
              ))}
            </FieldGroup>
          )}
        </div>
      ))}
    </div>
  )
}
