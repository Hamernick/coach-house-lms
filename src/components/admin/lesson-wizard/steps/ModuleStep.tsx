"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { ResourceList } from "@/components/admin/lesson-wizard/steps/ResourceList"
import { FormFieldsEditor } from "@/components/admin/lesson-wizard/steps/FormFieldsEditor"
import type { FormField as ModuleField, FormFieldType, Resource as ModuleResource } from "@/lib/lessons/types"
import { memo } from "react"

function ModuleStepBase({
  index,
  module,
  formFieldTypeOptions,
  defaultSliderRange,
  onChangeTitle,
  onChangeSubtitle,
  onChangeBody,
  onChangeVideoUrl,
  onAddResource,
  onUpdateResource,
  onRemoveResource,
  onAddField,
  onUpdateField,
  onRemoveField,
}: {
  index: number
  module: {
    title: string
    subtitle: string
    body: string
    videoUrl: string
    resources: ModuleResource[]
    formFields: ModuleField[]
  }
  formFieldTypeOptions: Array<{ value: FormFieldType; label: string }>
  defaultSliderRange: { min: number; max: number; step: number }
  onChangeTitle: (value: string) => void
  onChangeSubtitle: (value: string) => void
  onChangeBody: (value: string) => void
  onChangeVideoUrl: (value: string) => void
  onAddResource: () => void
  onUpdateResource: (resourceId: string, field: "title" | "url", value: string) => void
  onRemoveResource: (resourceId: string) => void
  onAddField: () => void
  onUpdateField: (fieldId: string, updater: (current: ModuleField) => ModuleField) => void
  onRemoveField: (fieldId: string) => void
}) {
  const active = module

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Module {index + 1}</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Configure the content, resources, and homework for this module.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Module Title *</Label>
            <span className="text-xs text-muted-foreground">{active.title.length}</span>
          </div>
          <Input
            placeholder="Getting Started with HTML"
            value={active.title}
            onChange={(e) => onChangeTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Subtitle</Label>
            <span className="text-xs text-muted-foreground">{active.subtitle.length}</span>
          </div>
          <Input
            placeholder="Learn the basics of HTML structure"
            value={active.subtitle}
            onChange={(e) => onChangeSubtitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor value={active.body} onChange={onChangeBody} placeholder="Module content and instructions..." />
        </div>

        <ResourceList
          resources={active.resources}
          onAdd={onAddResource}
          onUpdate={onUpdateResource}
          onRemove={onRemoveResource}
        />

        <FormFieldsEditor
          fields={active.formFields}
          formFieldTypeOptions={formFieldTypeOptions}
          defaultSliderRange={defaultSliderRange}
          onAddField={onAddField}
          onUpdateField={onUpdateField}
          onRemoveField={onRemoveField}
        />
      </div>
    </div>
  )
}

export const ModuleStep = memo(ModuleStepBase)
