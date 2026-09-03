import LockKeyholeIcon from "lucide-react/dist/esm/icons/lock-keyhole"

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldMessage,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { AccountSettingsErrorKey } from "../types"

type ProfileFieldsProps = {
  firstName: string
  lastName: string
  title: string
  company: string
  contact: string
  about: string
  phone: string
  email: string
  errors: Partial<Record<AccountSettingsErrorKey, string>>
  idPrefix?: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onTitleChange: (value: string) => void
  onCompanyChange: (value: string) => void
  onContactChange: (value: string) => void
  onAboutChange: (value: string) => void
  onPhoneChange: (value: string) => void
}

export function ProfileFields({
  firstName,
  lastName,
  title,
  company,
  contact,
  about,
  phone,
  email,
  errors,
  idPrefix = "profile",
  onFirstNameChange,
  onLastNameChange,
  onTitleChange,
  onCompanyChange,
  onContactChange,
  onAboutChange,
  onPhoneChange,
}: ProfileFieldsProps) {
  return (
    <section
      aria-labelledby={`${idPrefix}-details-heading`}
      className="space-y-5"
    >
      <div className="space-y-1">
        <h3
          id={`${idPrefix}-details-heading`}
          className="text-lg font-medium tracking-tight"
        >
          Personal details
        </h3>
        <p className="text-muted-foreground max-w-xl text-sm leading-6 text-pretty">
          Your name and role shape your profile preview.
        </p>
      </div>

      <FieldGroup className="gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-first-name`}>
              First name
            </FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-first-name`}
                name="given-name"
                autoComplete="given-name"
                placeholder="First name…"
                value={firstName}
                className="text-base sm:text-sm"
                aria-invalid={Boolean(errors.firstName)}
                onChange={(event) =>
                  onFirstNameChange(event.currentTarget.value)
                }
              />
            </FieldControl>
            {errors.firstName ? (
              <FieldMessage>{errors.firstName}</FieldMessage>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor={`${idPrefix}-last-name`}>Last name</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-last-name`}
                name="family-name"
                autoComplete="family-name"
                placeholder="Last name…"
                value={lastName}
                className="text-base sm:text-sm"
                aria-invalid={Boolean(errors.lastName)}
                onChange={(event) =>
                  onLastNameChange(event.currentTarget.value)
                }
              />
            </FieldControl>
            {errors.lastName ? (
              <FieldMessage>{errors.lastName}</FieldMessage>
            ) : null}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-title`}>Role</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-title`}
                name="organization-title"
                autoComplete="organization-title"
                placeholder="Board member, operator, advisor…"
                value={title}
                className="text-base sm:text-sm"
                onChange={(event) => onTitleChange(event.currentTarget.value)}
              />
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${idPrefix}-company`}>
              Organization
            </FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-company`}
                name="organization"
                autoComplete="organization"
                placeholder="Organization or affiliation…"
                value={company}
                className="text-base sm:text-sm"
                onChange={(event) => onCompanyChange(event.currentTarget.value)}
              />
            </FieldControl>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-about`}>About</FieldLabel>
          <FieldControl className="col-span-1">
            <Textarea
              id={`${idPrefix}-about`}
              name="about"
              placeholder="Share how you support organizations…"
              className="min-h-28 text-base sm:text-sm"
              value={about}
              onChange={(event) => onAboutChange(event.currentTarget.value)}
            />
          </FieldControl>
        </Field>

        <div className="space-y-4 border-t pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-medium">Contact</h4>
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <LockKeyholeIcon className="size-3" aria-hidden="true" />
              Private
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-phone`}>Phone</FieldLabel>
              <FieldControl className="col-span-1">
                <Input
                  id={`${idPrefix}-phone`}
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  className="text-base sm:text-sm"
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(event) => onPhoneChange(event.currentTarget.value)}
                />
              </FieldControl>
              {errors.phone ? (
                <FieldMessage>{errors.phone}</FieldMessage>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-email`}>Email</FieldLabel>
              <FieldControl className="col-span-1">
                <Input
                  id={`${idPrefix}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  className="text-base sm:text-sm"
                  disabled
                />
              </FieldControl>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor={`${idPrefix}-contact`}>
              Member contact
            </FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-contact`}
                name="member-contact"
                placeholder="Email, phone, LinkedIn, or website…"
                value={contact}
                className="text-base sm:text-sm"
                onChange={(event) => onContactChange(event.currentTarget.value)}
              />
            </FieldControl>
            <FieldDescription>
              Visible only in private member views.
            </FieldDescription>
          </Field>
        </div>
      </FieldGroup>
    </section>
  )
}
