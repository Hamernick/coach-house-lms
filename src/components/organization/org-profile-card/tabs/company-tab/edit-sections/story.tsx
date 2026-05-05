"use client"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
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
    name: "vision",
    label: "Vision",
    placeholder:
      "A city where every student has access to high-quality STEM learning.",
  },
  {
    name: "mission",
    label: "Mission",
    placeholder:
      "We equip middle school students with hands-on programs and mentors in technology careers.",
  },
  {
    name: "need",
    label: "Our need",
    placeholder:
      "Students in our district lack access to labs, internships, and career exposure.",
  },
  {
    name: "values",
    label: "Values",
    placeholder: "Equity, curiosity, community",
  },
  {
    name: "theoryOfChange",
    label: "Theory of change",
    placeholder:
      "When students, mentors, and core supports are connected early, confidence and long-term opportunity grow.",
  },
] as const

function StoryTextField({
  company,
  errors,
  field,
  onInputChange,
}: Pick<CompanyEditProps, "company" | "errors" | "onInputChange"> & {
  field: (typeof STORY_FIELDS)[number]
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
            "ml-auto tabular-nums text-muted-foreground",
            overLimit && "font-medium text-destructive",
          )}
        >
          {count.toLocaleString()} / {ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH.toLocaleString()}
        </p>
      </div>
    </ProfileField>
  )
}

export function StorySection({ company, errors, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="About us" description="What you do, why it matters, and how change happens.">
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
      </div>
    </FormRow>
  )
}
