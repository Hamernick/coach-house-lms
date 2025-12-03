"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down"
import Plus from "lucide-react/dist/esm/icons/plus"
import X from "lucide-react/dist/esm/icons/x"
import type { FormField as ModuleField, FormFieldType } from "@/lib/lessons/types"
import { memo, useState } from "react"
import { Badge } from "@/components/ui/badge"

function FormFieldsEditorBase({
  fields,
  formFieldTypeOptions,
  defaultSliderRange,
  onAddField,
  onUpdateField,
  onRemoveField,
}: {
  fields: ModuleField[]
  formFieldTypeOptions: Array<{ value: FormFieldType; label: string }>
  defaultSliderRange: { min: number; max: number; step: number }
  onAddField: () => void
  onUpdateField: (fieldId: string, updater: (current: ModuleField) => ModuleField) => void
  onRemoveField: (fieldId: string) => void
}) {
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({})
  const hasFields = fields.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-sm font-medium leading-tight">Homework Fields</Label>
          <p className="text-xs text-muted-foreground">
            Collect structured responses and guide learners through the module assignments.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddField}>
          <Plus className="mr-2 h-4 w-4" /> Add Field
        </Button>
      </div>

      {hasFields ? (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const showPlaceholder = field.type === "short_text" || field.type === "long_text"
            const showOptions = field.type === "select" || field.type === "multi_select"
            const showSlider = field.type === "slider"
            const showProgram = field.type === "custom_program"
            const showRequiredToggle = field.type !== "subtitle"
            const rawOptions = Array.isArray(field.options) ? field.options : []
            const normalizedOptions = rawOptions
              .map((option) => {
                if (typeof option === "string") return option
                if (option && typeof option === "object") {
                  const opt = option as { label?: unknown; value?: unknown }
                  const label = typeof opt.label === "string" ? opt.label : ""
                  const value = typeof opt.value === "string" ? opt.value : ""
                  return label || value
                }
                return ""
              })
              .filter((value): value is string => value.length > 0)
            const typeLabel =
              formFieldTypeOptions.find((option) => option.value === field.type)?.label ?? "Field"
            const labelId = `field-${field.id}-label`
            const placeholderId = `field-${field.id}-placeholder`
            const descriptionId = `field-${field.id}-description`

            return (
              <Card key={field.id} className="gap-0">
                <CardHeader className="relative flex flex-wrap items-start gap-3 border-b pb-4 pr-14">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold">
                      {field.label || `Field ${index + 1}`}
                    </CardTitle>
                    <CardDescription>
                      {field.type === "subtitle"
                        ? "Display a heading and supporting copy inside the assignment."
                        : "Adjust the field type and copy to match the learner prompt."}
                    </CardDescription>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="uppercase tracking-wide">
                        {typeLabel}
                      </Badge>
                      {field.required ? (
                        <Badge variant="outline" className="border-destructive/30 text-destructive">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </div>
                  </div>
                  <div className="absolute right-3 top-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveField(field.id)}
                      aria-label={`Remove field ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-6 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Field type</Label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-md border bg-background p-2 pr-10 text-sm"
                          value={field.type}
                          onChange={(e) =>
                            onUpdateField(field.id, (current) => ({ ...current, type: e.target.value as FormFieldType }))
                          }
                        >
                          {formFieldTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                      </div>
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor={labelId}>{field.type === "subtitle" ? "Subtitle heading" : "Field label"}</Label>
                        <Input
                        id={labelId}
                        placeholder={field.type === "subtitle" ? "Section title" : "Field label"}
                        value={field.label}
                        onChange={(e) => onUpdateField(field.id, (current) => ({ ...current, label: e.target.value }))}
                      />
                    </div>

                    {showPlaceholder ? (
                      <div className="space-y-2">
                        <Label htmlFor={placeholderId}>Placeholder</Label>
                        <Input
                          id={placeholderId}
                          placeholder="Placeholder text"
                          value={field.placeholder ?? ""}
                          onChange={(e) =>
                            onUpdateField(field.id, (current) => ({ ...current, placeholder: e.target.value }))
                          }
                        />
                      </div>
                    ) : null}

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={descriptionId}>
                        {field.type === "subtitle" ? "Supporting text" : "Help text"}
                      </Label>
                      <Textarea
                        id={descriptionId}
                        placeholder={
                          field.type === "subtitle"
                            ? "Add context for this module section"
                            : "Provide guidance or examples for learners"
                        }
                        value={field.description ?? ""}
                        onChange={(e) =>
                          onUpdateField(field.id, (current) => ({ ...current, description: e.target.value }))
                        }
                        rows={field.type === "subtitle" ? 2 : 3}
                      />
                    </div>
                  </div>

                  {showOptions ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <Label>Add option</Label>
                          <Input
                            placeholder="Write a prompt response here..."
                            value={optionDrafts[field.id] ?? ""}
                            onChange={(e) =>
                              setOptionDrafts((prev) => ({ ...prev, [field.id]: e.target.value }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault()
                                const value = optionDrafts[field.id]?.trim()
                                if (!value) return
                                const nextOptions = [...normalizedOptions]
                                if (!nextOptions.includes(value)) {
                                  nextOptions.push(value)
                                  onUpdateField(field.id, (current) => ({ ...current, options: nextOptions }))
                                }
                                setOptionDrafts((prev) => ({ ...prev, [field.id]: "" }))
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="md:self-end"
                          onClick={() => {
                            const value = optionDrafts[field.id]?.trim()
                            if (!value) return
                            const nextOptions = [...normalizedOptions]
                            if (!nextOptions.includes(value)) {
                              nextOptions.push(value)
                              onUpdateField(field.id, (current) => ({ ...current, options: nextOptions }))
                            }
                            setOptionDrafts((prev) => ({ ...prev, [field.id]: "" }))
                          }}
                        >
                          Add option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Current options</Label>
                        <div className="flex flex-wrap gap-2">
                          {normalizedOptions.map((option, optionIndex) => (
                              <span
                                key={`${field.id}-option-${optionIndex}`}
                                className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                              >
                                {option}
                                <button
                                  type="button"
                                  className="text-muted-foreground/70 transition hover:text-destructive"
                                  onClick={() => {
                                    const filtered = normalizedOptions.filter((_, idx) => idx !== optionIndex)
                                    onUpdateField(field.id, (current) => ({ ...current, options: filtered }))
                                  }}
                                  aria-label={`Remove option ${option}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          {normalizedOptions.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              No options yet. Add options above to populate the menu.
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Learners will see these as selectable choices in the order listed.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {showSlider ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {(["min", "max", "step"] as const).map((key) => (
                        <div className="space-y-2" key={key}>
                          <Label className="capitalize">{key}</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder={String(defaultSliderRange[key])}
                            value={field[key] ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? null : Number(e.target.value)
                              onUpdateField(field.id, (current) => ({ ...current, [key]: val }))
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {showProgram ? (
                    <div className="space-y-2">
                      <Label>Program instructions</Label>
                      <Textarea
                        placeholder="Describe how the learner should build their custom program..."
                        value={field.programTemplate ?? ""}
                        onChange={(e) =>
                          onUpdateField(field.id, (current) => ({ ...current, programTemplate: e.target.value }))
                        }
                        rows={4}
                      />
                    </div>
                  ) : null}

                  {showRequiredToggle ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          onUpdateField(field.id, (current) => ({ ...current, required: e.target.checked }))
                        }
                        className="rounded border-input"
                      />
                      Required response
                    </label>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No homework fields yet. Craft prompts to capture learner reflections or uploads.
        </div>
      )}
    </div>
  )
}

export const FormFieldsEditor = memo(FormFieldsEditorBase)
