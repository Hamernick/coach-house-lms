import dynamic from "next/dynamic"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { ModuleAssignmentField } from "../../types"
import { RoadmapCheckpointField } from "./roadmap-checkpoint-field"
import { normalizeOptions, type AssignmentValues } from "../utils"
import { cn } from "@/lib/utils"
import { getRoadmapSectionDefinition, type RoadmapSectionStatus } from "@/lib/roadmap"
import { AssignmentBudgetTableField } from "./assignment-budget-table-field"

const RichTextEditorLazy = dynamic(
  () => import("@/components/rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[240px] rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
)

type AssignmentFieldProps = {
  field: ModuleAssignmentField
  values: AssignmentValues
  pending: boolean
  autoSaving: boolean
  isStepper: boolean
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  isAcceleratorShell: boolean
  richTextMinHeight: number
  updateValue: (name: string, value: AssignmentValues[string]) => void
  options?: { hideLabel?: boolean }
}

export function AssignmentField({
  field,
  values,
  pending,
  autoSaving,
  isStepper,
  roadmapStatusBySectionId,
  isAcceleratorShell,
  richTextMinHeight,
  updateValue,
  options,
}: AssignmentFieldProps) {
  const hideLabel = Boolean(options?.hideLabel)
  const labelText = field.required ? `${field.label} *` : field.label
  const labelClassName = cn(
    "text-base font-semibold leading-tight select-text",
    hideLabel && "sr-only",
  )
  const description = field.description ? (
    <FieldDescription className="whitespace-pre-line">
      {field.description}
    </FieldDescription>
  ) : null
  const fieldId = field.name

  switch (field.type) {
    case "short_text":
      return (
        <Field className="gap-2">
          <FieldLabel htmlFor={fieldId} className={labelClassName}>
            {labelText}
          </FieldLabel>
          {description}
          <Input
            id={fieldId}
            value={(values[field.name] as string) ?? ""}
            placeholder={field.placeholder}
            required={field.required}
            onChange={(event) => updateValue(field.name, event.target.value)}
          />
        </Field>
      )
    case "long_text": {
      const value = (values[field.name] as string) ?? ""
      if (field.roadmapSectionId) {
        const roadmapDefinition = getRoadmapSectionDefinition(field.roadmapSectionId)
        if (roadmapDefinition) {
          return (
            <RoadmapCheckpointField
              field={field}
              definition={roadmapDefinition}
              value={value}
              pending={pending}
              autoSaving={autoSaving}
              roadmapStatusBySectionId={roadmapStatusBySectionId}
              onChange={(next) => updateValue(field.name, next)}
            />
          )
        }
      }
      return (
        <Field className="gap-3">
          <FieldLabel htmlFor={fieldId} className={cn(labelClassName, "w-full")}>
            {labelText}
          </FieldLabel>
          {field.description ? (
            <FieldDescription className="text-left whitespace-pre-line">
              {field.description}
            </FieldDescription>
          ) : null}
          <div className={cn(isAcceleratorShell ? "min-h-[560px]" : "min-h-[420px]")}>
            <RichTextEditorLazy
              value={value}
              onChange={(next) => updateValue(field.name, next)}
              placeholder={field.placeholder}
              mode="homework"
              minHeight={richTextMinHeight}
            />
          </div>
        </Field>
      )
    }
    case "select": {
      const normalizedOptions = normalizeOptions(field.options ?? [])
      const rawFieldValue = values[field.name]
      const selectedValueRaw = typeof rawFieldValue === "string" ? rawFieldValue : ""
      const selectedValue =
        selectedValueRaw && normalizedOptions.some((option) => option.value === selectedValueRaw)
          ? selectedValueRaw
          : undefined
      return (
        <Field className="gap-2">
          <FieldLabel className={labelClassName}>{labelText}</FieldLabel>
          {description}
          <Select
            value={selectedValue}
            onValueChange={(next) => updateValue(field.name, next)}
            disabled={normalizedOptions.length === 0}
          >
            <SelectTrigger
              id={fieldId}
              aria-required={field.required}
              className="w-full"
            >
              <SelectValue placeholder={field.placeholder ?? "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {normalizedOptions.map((option) => (
                <SelectItem key={option.key} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {normalizedOptions.length === 0 ? (
            <FieldDescription>No options configured.</FieldDescription>
          ) : null}
        </Field>
      )
    }
    case "multi_select": {
      const normalizedOptions = normalizeOptions(field.options ?? [])
      return (
        <Field className="gap-2">
          <FieldLabel className={labelClassName}>{labelText}</FieldLabel>
          {description}
          <div className="flex flex-col gap-2">
            {normalizedOptions.map((option) => {
              const selected = Array.isArray(values[field.name]) ? (values[field.name] as string[]) : []
              const checked = selected.includes(option.value)
              return (
                <label key={option.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      const current = Array.isArray(values[field.name]) ? [...(values[field.name] as string[])] : []
                      const isChecked = next === true
                      if (isChecked && !current.includes(option.value)) {
                        current.push(option.value)
                      }
                      if (!isChecked) {
                        const index = current.indexOf(option.value)
                        if (index >= 0) current.splice(index, 1)
                      }
                      updateValue(field.name, current)
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
            {normalizedOptions.length === 0 ? (
              <FieldDescription>No options configured.</FieldDescription>
            ) : null}
          </div>
        </Field>
      )
    }
    case "budget_table":
      return (
        <AssignmentBudgetTableField
          field={field}
          values={values}
          isStepper={isStepper}
          labelClassName={labelClassName}
          labelText={labelText}
          updateValue={updateValue}
        />
      )
    case "slider": {
      const sliderValue = typeof values[field.name] === "number" ? (values[field.name] as number) : field.min ?? 0
      const min = field.min ?? 0
      const max = field.max ?? min + 100
      const step = field.step ?? 1
      return (
        <Field className="gap-2">
          <div className="flex items-center justify-between">
            <FieldLabel
              className={cn(
                "text-sm font-medium leading-tight select-text",
                hideLabel && "sr-only",
              )}
            >
              {labelText}
            </FieldLabel>
            <span className="text-xs text-muted-foreground">{sliderValue}</span>
          </div>
          {description}
          <Slider
            value={[sliderValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={(next) => updateValue(field.name, next[0] ?? min)}
          />
        </Field>
      )
    }
    case "custom_program":
      return (
        <Field className="gap-2">
          <FieldLabel htmlFor={fieldId} className={labelClassName}>
            {labelText}
          </FieldLabel>
          {description}
          {field.programTemplate ? (
            <p className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              {field.programTemplate}
            </p>
          ) : null}
          <div className={cn(isAcceleratorShell ? "min-h-[560px]" : "min-h-[420px]")}>
            <RichTextEditorLazy
              value={(values[field.name] as string) ?? ""}
              onChange={(next) => updateValue(field.name, next)}
              placeholder={field.placeholder ?? "Outline your plan"}
              mode="homework"
              minHeight={richTextMinHeight}
            />
          </div>
        </Field>
      )
    default:
      return null
  }
}
