"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { BrandIdentityDraft } from "../../types"
import { BrandIdentitySection } from "./brand-identity-section"

export function FoundationSection({
  draft,
  updateDraft,
}: {
  draft: BrandIdentityDraft
  updateDraft: (value: Partial<BrandIdentityDraft>) => void
}) {
  return (
    <BrandIdentitySection
      id="foundation"
      eyebrow="Start with meaning"
      title="Foundation"
      description="Write the decisions that every visual choice should support. Clear inputs make the finished system easier for staff, volunteers, and partners to use."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Organization name" htmlFor="brand-organization-name">
          <Input
            id="brand-organization-name"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft({ organizationName: event.target.value })
            }
          />
        </Field>
        <Field label="Tagline" htmlFor="brand-tagline">
          <Input
            id="brand-tagline"
            value={draft.tagline}
            onChange={(event) => updateDraft({ tagline: event.target.value })}
          />
        </Field>
        <Field label="Introduction" htmlFor="brand-introduction" wide>
          <Textarea
            id="brand-introduction"
            rows={4}
            value={draft.introduction}
            onChange={(event) =>
              updateDraft({ introduction: event.target.value })
            }
          />
        </Field>
        <Field label="Purpose" htmlFor="brand-purpose">
          <Textarea
            id="brand-purpose"
            rows={4}
            value={draft.purpose}
            onChange={(event) => updateDraft({ purpose: event.target.value })}
          />
        </Field>
        <Field label="Primary audience" htmlFor="brand-audience">
          <Textarea
            id="brand-audience"
            rows={4}
            value={draft.audience}
            onChange={(event) => updateDraft({ audience: event.target.value })}
          />
        </Field>
      </div>
      <div className="mt-10 border-y py-10">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
          Live introduction
        </p>
        <h3
          className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
          style={{ fontFamily: draft.headingFont }}
        >
          {draft.organizationName || "Your nonprofit"}
        </h3>
        <p className="mt-3 text-lg leading-8">{draft.tagline}</p>
        <p className="text-muted-foreground mt-6 max-w-2xl text-sm leading-6">
          {draft.introduction}
        </p>
      </div>
    </BrandIdentitySection>
  )
}

function Field({
  label,
  htmlFor,
  children,
  wide = false,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}
