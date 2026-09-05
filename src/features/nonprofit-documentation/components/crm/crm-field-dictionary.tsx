import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type {
  CrmFieldCategoryId,
  CrmFieldDraft,
  CrmFieldSensitivityId,
  CrmPlanDraft,
} from "../../crm-types"
import {
  CRM_FIELD_CATEGORIES,
  CRM_FIELD_SENSITIVITY,
  MAX_CRM_FIELDS,
} from "../../lib/crm-plan"

function FieldTextarea({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  maxLength: number
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={3}
        placeholder={placeholder}
        className="min-h-24 resize-y text-sm"
      />
    </Field>
  )
}

function CrmFieldCard({
  field,
  index,
  canRemove,
  updateField,
  removeField,
}: {
  field: CrmFieldDraft
  index: number
  canRemove: boolean
  updateField: <Key extends keyof CrmFieldDraft>(
    id: string,
    key: Key,
    value: CrmFieldDraft[Key]
  ) => void
  removeField: (id: string) => void
}) {
  const prefix = `crm-field-${field.id}`
  const category = CRM_FIELD_CATEGORIES.find(({ id }) => id === field.category)
  const sensitivity = CRM_FIELD_SENSITIVITY.find(
    ({ id }) => id === field.sensitivity
  )

  return (
    <section
      className="bg-background border"
      aria-labelledby={`${prefix}-title`}
    >
      <div className="bg-muted/30 flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-muted-foreground font-mono text-xs tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            id={`${prefix}-title`}
            className="mt-1 truncate text-sm font-semibold"
          >
            {field.label || "Unnamed proposed field"}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          disabled={!canRemove}
          aria-label={`Remove proposed field ${index + 1}`}
          onClick={() => removeField(field.id)}
        >
          <Trash2Icon aria-hidden />
        </Button>
      </div>
      <FieldGroup className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <Field className="lg:col-span-2">
          <FieldLabel htmlFor={`${prefix}-label`}>
            Generic field label
          </FieldLabel>
          <Input
            id={`${prefix}-label`}
            name={`${prefix}-label`}
            value={field.label}
            onChange={(event) =>
              updateField(field.id, "label", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Contact preference status—not a person’s value…"
            className="min-h-11 text-sm"
          />
          <FieldDescription>
            Describe the field only. Do not enter real names, contact details,
            case notes, health data, credentials, or other personal information.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-category`}>Field category</FieldLabel>
          <Select
            name={`${prefix}-category`}
            value={field.category}
            onValueChange={(value) =>
              updateField(field.id, "category", value as CrmFieldCategoryId)
            }
          >
            <SelectTrigger
              id={`${prefix}-category`}
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CRM_FIELD_CATEGORIES.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>{category?.description}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-sensitivity`}>
            Working sensitivity
          </FieldLabel>
          <Select
            name={`${prefix}-sensitivity`}
            value={field.sensitivity}
            onValueChange={(value) =>
              updateField(
                field.id,
                "sensitivity",
                value as CrmFieldSensitivityId
              )
            }
          >
            <SelectTrigger
              id={`${prefix}-sensitivity`}
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CRM_FIELD_SENSITIVITY.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            {sensitivity?.description} This label is a review prompt, not a risk
            or legal determination.
          </FieldDescription>
        </Field>
        <FieldTextarea
          id={`${prefix}-purpose`}
          label="Specific purpose and decision"
          value={field.purpose}
          maxLength={500}
          placeholder="Why is this field necessary, which decision uses it, and what less-sensitive alternative was considered?…"
          onChange={(value) => updateField(field.id, "purpose", value)}
        />
        <FieldTextarea
          id={`${prefix}-source`}
          label="Source, notice, and update path"
          value={field.source}
          maxLength={400}
          placeholder="Where does the value come from, what was the person told, and how can it be corrected or changed?…"
          onChange={(value) => updateField(field.id, "source", value)}
        />
        <FieldTextarea
          id={`${prefix}-access`}
          label="Minimum access role"
          value={field.accessRole}
          maxLength={240}
          placeholder="Name the smallest responsible role that needs this field and why…"
          onChange={(value) => updateField(field.id, "accessRole", value)}
        />
        <FieldTextarea
          id={`${prefix}-retention`}
          label="Retention and renewed-review trigger"
          value={field.retentionReview}
          maxLength={300}
          placeholder="When is the field reviewed, corrected, archived, removed, preserved, or reconsidered with qualified guidance?…"
          onChange={(value) => updateField(field.id, "retentionReview", value)}
        />
      </FieldGroup>
    </section>
  )
}

export function CrmFieldDictionary({
  draft,
  updateField,
  addField,
  removeField,
}: {
  draft: CrmPlanDraft
  updateField: <Key extends keyof CrmFieldDraft>(
    id: string,
    key: Key,
    value: CrmFieldDraft[Key]
  ) => void
  addField: () => void
  removeField: (id: string) => void
}) {
  return (
    <FieldSet className="border-t p-4 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <FieldLegend>Proposed field dictionary</FieldLegend>
          <FieldDescription className="mt-2 leading-5">
            Define up to {MAX_CRM_FIELDS} generic fields. This is a schema
            exercise, not a contact list; use fictional examples only.
          </FieldDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={draft.fields.length >= MAX_CRM_FIELDS}
          onClick={addField}
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add proposed field
        </Button>
      </div>
      <FieldGroup className="mt-3 gap-4">
        {draft.fields.map((field, index) => (
          <CrmFieldCard
            key={field.id}
            field={field}
            index={index}
            canRemove={draft.fields.length > 1}
            updateField={updateField}
            removeField={removeField}
          />
        ))}
      </FieldGroup>
    </FieldSet>
  )
}
