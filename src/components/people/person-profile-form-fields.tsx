"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type OrgPerson } from "@/actions/people"
import { ManagerSelect } from "@/components/people/manager-select"
import {
  PERSON_CATEGORY_META,
  PERSON_CATEGORY_OPTIONS,
} from "@/lib/people/categories"

type PersonProfileFormFieldsProps = {
  formId: string
  initialPersonId?: string | null
  people: OrgPerson[]
  name: string
  title: string
  email: string
  linkedin: string
  category: OrgPerson["category"]
  image: string | null
  reportsToId: string | null
  onNameChange: (value: string) => void
  onTitleChange: (value: string) => void
  onEmailChange: (value: string) => void
  onLinkedinChange: (value: string) => void
  onCategoryChange: (value: OrgPerson["category"]) => void
  onImageChange: (value: string | null) => void
  onReportsToChange: (value: string | null) => void
}

function canAssignManager(_category: OrgPerson["category"]) {
  return true
}

function resolveLinkedInHref(linkedin: string) {
  const trimmed = linkedin.trim()
  if (!trimmed) return ""
  return trimmed.startsWith("http")
    ? trimmed
    : `https://www.linkedin.com/in/${trimmed.replace(/^\//, "")}`
}

function resolveInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?"
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
}

export function PersonProfileFormFields({
  formId,
  initialPersonId,
  people,
  name,
  title,
  email,
  linkedin,
  category,
  image,
  reportsToId,
  onNameChange,
  onTitleChange,
  onEmailChange,
  onLinkedinChange,
  onCategoryChange,
  onImageChange,
  onReportsToChange,
}: PersonProfileFormFieldsProps) {
  const categoryMeta = PERSON_CATEGORY_META[category]
  const linkedInHref = resolveLinkedInHref(linkedin)

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onImageChange(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <section
        className="border-border/60 bg-muted/30 rounded-2xl border p-4"
        aria-labelledby={`${formId}-photo-heading`}
      >
        <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center">
          <Avatar className="size-20 sm:size-24">
            <AvatarImage src={image ?? undefined} alt={name} />
            <AvatarFallback>{resolveInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <Label
              id={`${formId}-photo-heading`}
              htmlFor={`${formId}-image`}
              className="text-sm font-medium"
            >
              Profile photo
            </Label>
            <Input
              id={`${formId}-image`}
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            <p className="text-muted-foreground text-xs">
              Square images work best.
            </p>
          </div>
        </div>
      </section>

      <section
        className="space-y-4"
        aria-labelledby={`${formId}-identity-heading`}
      >
        <div>
          <h3
            id={`${formId}-identity-heading`}
            className="text-sm font-semibold"
          >
            Profile
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Core details used across the platform.
          </p>
        </div>
        <FieldGroup className="gap-4">
          <Field orientation="responsive">
            <FieldLabel htmlFor={`${formId}-name`}>Name</FieldLabel>
            <FieldControl>
              <Input
                id={`${formId}-name`}
                name="name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
              />
            </FieldControl>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
            <FieldControl>
              <Input
                id={`${formId}-title`}
                name="organization-title"
                value={title ?? ""}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="Role or title"
                autoComplete="organization-title"
              />
            </FieldControl>
          </Field>
          <Field orientation="responsive">
            <FieldLabel>Relationship</FieldLabel>
            <FieldControl>
              <Select
                value={category}
                onValueChange={(value) => {
                  const nextCategory = value as OrgPerson["category"]
                  onCategoryChange(nextCategory)
                  if (!canAssignManager(nextCategory)) onReportsToChange(null)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {PERSON_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription className="mt-2">
                This controls where they appear across People and lists.
              </FieldDescription>
              <div className="mt-2 text-xs">
                <span
                  className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 ${categoryMeta.badgeClass}`}
                >
                  <span
                    className={`inline-block size-2 rounded-full ${categoryMeta.dotClass}`}
                    aria-hidden
                  />
                  {categoryMeta.label}
                </span>
              </div>
            </FieldControl>
          </Field>
          {canAssignManager(category) ? (
            <Field orientation="responsive">
              <FieldLabel>Reports to</FieldLabel>
              <FieldControl>
                <ManagerSelect
                  value={reportsToId}
                  options={people.filter(
                    (person) =>
                      !initialPersonId || person.id !== initialPersonId
                  )}
                  onChange={(value) => onReportsToChange(value)}
                  className="w-full"
                />
                <FieldDescription className="mt-2">
                  Optional: set their reporting line.
                </FieldDescription>
              </FieldControl>
            </Field>
          ) : null}
        </FieldGroup>
      </section>

      <section
        className="space-y-4"
        aria-labelledby={`${formId}-contact-heading`}
      >
        <div>
          <h3
            id={`${formId}-contact-heading`}
            className="text-sm font-semibold"
          >
            Contact
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Optional contact and profile links.
          </p>
        </div>
        <FieldGroup className="gap-4">
          <Field orientation="responsive">
            <FieldLabel htmlFor={`${formId}-email`}>Email</FieldLabel>
            <FieldControl>
              <Input
                id={`${formId}-email`}
                name="email"
                type="email"
                value={email ?? ""}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="name@org.org"
                autoComplete="email"
              />
              <FieldDescription className="mt-2">
                Used for contact cards.
              </FieldDescription>
            </FieldControl>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor={`${formId}-linkedin`}>LinkedIn</FieldLabel>
            <FieldControl>
              <InputGroup>
                <Input
                  id={`${formId}-linkedin`}
                  name="linkedin"
                  value={linkedin ?? ""}
                  onChange={(event) => onLinkedinChange(event.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  autoComplete="url"
                />
                <InputGroupAddon>
                  <InputGroupButton
                    type="button"
                    disabled={!linkedInHref}
                    onClick={() => {
                      if (linkedInHref) window.open(linkedInHref, "_blank")
                    }}
                  >
                    Open
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                If set, we’ll auto-fetch their photo on save.
              </FieldDescription>
            </FieldControl>
          </Field>
        </FieldGroup>
      </section>
    </div>
  )
}
