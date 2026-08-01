"use client"

import { RichTextEditor } from "@/components/rich-text-editor"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  FormRow,
  ProfileField,
} from "@/components/organization/org-profile-card/shared"
import { ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH } from "@/components/organization/org-profile-card/validation"
import type { CompanyEditProps } from "../types"

const STORY_FIELDS = [
  {
    name: "originStory",
    label: "Origin story",
    placeholder:
      "We started after seeing students and families navigate fragmented support alone.",
  },
  {
    name: "need",
    label: "Our need",
    placeholder:
      "Students in our district lack access to labs, internships, and career exposure.",
  },
] as const

const THEORY_FIELD = {
  name: "theoryOfChange",
  label: "Theory of change",
  placeholder:
    "When students, mentors, and core supports are connected early, confidence and long-term opportunity grow.",
} as const

const NARRATIVE_FIELDS = [
  {
    name: "mission",
    label: "Mission",
    placeholder:
      "We equip middle school students with hands-on programs and mentors in technology careers.",
  },
  {
    name: "vision",
    label: "Vision",
    placeholder:
      "A city where every student has access to high-quality STEM learning.",
  },
  {
    name: "values",
    label: "Values",
    placeholder: "Equity, curiosity, community",
  },
] as const

function StoryTextField({
  company,
  errors,
  field,
  onInputChange,
}: Pick<CompanyEditProps, "company" | "errors" | "onInputChange"> & {
  field: (typeof STORY_FIELDS)[number] | typeof THEORY_FIELD
}) {
  const value = company[field.name] ?? ""
  const error = errors[field.name] ?? ""
  const count = value.length
  const overLimit = count > ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH

  return (
    <ProfileField label={field.label}>
      <Textarea
        name={field.name}
        value={value}
        onChange={onInputChange}
        rows={4}
        maxLength={ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH}
        placeholder={field.placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={`${field.name}-limit${error ? ` ${field.name}-error` : ""}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {error ? (
          <p id={`${field.name}-error`} className="text-destructive">
            {error}
          </p>
        ) : (
          <span aria-hidden />
        )}
        <p
          id={`${field.name}-limit`}
          className={cn(
            "text-muted-foreground ml-auto tabular-nums",
            overLimit && "text-destructive font-medium"
          )}
        >
          {count.toLocaleString()} /{" "}
          {ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH.toLocaleString()}
        </p>
      </div>
    </ProfileField>
  )
}

function StoryNarrativeField({
  company,
  errors,
  field,
  onUpdate,
  onDirty,
}: Pick<CompanyEditProps, "company" | "errors" | "onUpdate" | "onDirty"> & {
  field: (typeof NARRATIVE_FIELDS)[number]
}) {
  const value = company[field.name] ?? ""
  const error = errors[field.name] ?? ""

  return (
    <ProfileField label={field.label}>
      <RichTextEditor
        value={value}
        onChange={(nextValue) => {
          onUpdate({ [field.name]: nextValue })
          onDirty()
        }}
        ariaLabel={field.label}
        placeholder={field.placeholder}
        mode="compact"
        minHeight={160}
        maxHeight={360}
        stableScrollbars
        preserveImages
        editorClassName="min-h-[160px]"
      />
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </ProfileField>
  )
}

export function StorySection({
  company,
  errors,
  onInputChange,
  onUpdate,
  onDirty,
}: CompanyEditProps) {
  return (
    <FormRow
      title="About us"
      description="What you do, why it matters, and how change happens."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {STORY_FIELDS.map((field) => (
          <StoryTextField
            key={field.name}
            company={company}
            errors={errors}
            field={field}
            onInputChange={onInputChange}
          />
        ))}
        {NARRATIVE_FIELDS.map((field) => (
          <StoryNarrativeField
            key={field.name}
            company={company}
            errors={errors}
            field={field}
            onUpdate={onUpdate}
            onDirty={onDirty}
          />
        ))}
        <StoryTextField
          company={company}
          errors={errors}
          field={THEORY_FIELD}
          onInputChange={onInputChange}
        />
      </div>
    </FormRow>
  )
}
