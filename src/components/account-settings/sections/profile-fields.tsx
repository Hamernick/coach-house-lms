import { Field, FieldControl, FieldDescription, FieldGroup, FieldLabel, FieldMessage } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { AccountSettingsErrorKey } from "../types"
import { ProfileAvatarField } from "./profile-avatar-field"

type ProfileFieldsProps = {
  avatarUrl: string | null
  firstName: string
  lastName: string
  title: string
  company: string
  contact: string
  about: string
  phone: string
  email: string
  errors: Partial<Record<AccountSettingsErrorKey, string>>
  isUploadingAvatar: boolean
  idPrefix?: string
  onAvatarFileSelected: (file?: File | null) => void
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onTitleChange: (value: string) => void
  onCompanyChange: (value: string) => void
  onContactChange: (value: string) => void
  onAboutChange: (value: string) => void
  onPhoneChange: (value: string) => void
}

export function ProfileFields({
  avatarUrl,
  firstName,
  lastName,
  title,
  company,
  contact,
  about,
  phone,
  email,
  errors,
  isUploadingAvatar,
  idPrefix = "profile",
  onAvatarFileSelected,
  onFirstNameChange,
  onLastNameChange,
  onTitleChange,
  onCompanyChange,
  onContactChange,
  onAboutChange,
  onPhoneChange,
}: ProfileFieldsProps) {
  const initials = `${(firstName.charAt(0) || "A").toUpperCase()}${(lastName.charAt(0) || "A").toUpperCase()}`

  return (
    <div className="max-w-2xl">
      <FieldGroup className="gap-5">
        <ProfileAvatarField
          avatarUrl={avatarUrl}
          initials={initials}
          isUploadingAvatar={isUploadingAvatar}
          inputId={`${idPrefix}-avatar-upload`}
          onAvatarFileSelected={onAvatarFileSelected}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-first-name`}>First name</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-first-name`}
                placeholder="First name"
                value={firstName}
                aria-invalid={Boolean(errors.firstName)}
                onChange={(event) => onFirstNameChange(event.currentTarget.value)}
              />
            </FieldControl>
            {errors.firstName ? <FieldMessage>{errors.firstName}</FieldMessage> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor={`${idPrefix}-last-name`}>Last name</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-last-name`}
                placeholder="Last name"
                value={lastName}
                aria-invalid={Boolean(errors.lastName)}
                onChange={(event) => onLastNameChange(event.currentTarget.value)}
              />
            </FieldControl>
            {errors.lastName ? <FieldMessage>{errors.lastName}</FieldMessage> : null}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-title`}>Title</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-title`}
                placeholder="Board member, operator, advisor"
                value={title}
                onChange={(event) => onTitleChange(event.currentTarget.value)}
              />
            </FieldControl>
            <FieldDescription>Saved to your internal profile.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${idPrefix}-company`}>Company</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-company`}
                placeholder="Company or affiliation"
                value={company}
                onChange={(event) => onCompanyChange(event.currentTarget.value)}
              />
            </FieldControl>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-phone`}>Phone</FieldLabel>
            <FieldControl className="col-span-1">
              <Input
                id={`${idPrefix}-phone`}
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(event) => onPhoneChange(event.currentTarget.value)}
              />
            </FieldControl>
            {errors.phone ? <FieldMessage>{errors.phone}</FieldMessage> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor={`${idPrefix}-email`}>Email</FieldLabel>
            <FieldControl className="col-span-1">
              <Input id={`${idPrefix}-email`} value={email} disabled />
            </FieldControl>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-contact`}>Contact</FieldLabel>
          <FieldControl className="col-span-1">
            <Input
              id={`${idPrefix}-contact`}
              placeholder="Email, phone, LinkedIn, or website"
              value={contact}
              onChange={(event) => onContactChange(event.currentTarget.value)}
            />
          </FieldControl>
          <FieldDescription>Optional contact details you want visible in internal member views.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-about`}>About</FieldLabel>
          <FieldControl className="col-span-1">
            <Textarea
              id={`${idPrefix}-about`}
              placeholder="Share a short note about who you are and how you support organizations."
              className="min-h-28"
              value={about}
              onChange={(event) => onAboutChange(event.currentTarget.value)}
            />
          </FieldControl>
          <FieldDescription>Optional short bio for your internal member profile.</FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  )
}
