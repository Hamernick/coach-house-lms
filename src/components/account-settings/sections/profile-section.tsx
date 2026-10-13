import { PublicProfileSettings } from "@/features/public-profiles/client"

import type { AccountSettingsErrorKey } from "../types"
import { ProfileFields } from "./profile-fields"

export type ProfileSectionProps = {
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
  idPrefix: string
  onAvatarFileSelected: (file?: File | null) => void
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onTitleChange: (value: string) => void
  onCompanyChange: (value: string) => void
  onContactChange: (value: string) => void
  onAboutChange: (value: string) => void
  onPhoneChange: (value: string) => void
}

export function ProfileSection({
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
  idPrefix,
  onAvatarFileSelected,
  onFirstNameChange,
  onLastNameChange,
  onTitleChange,
  onCompanyChange,
  onContactChange,
  onAboutChange,
  onPhoneChange,
}: ProfileSectionProps) {
  return (
    <PublicProfileSettings
      avatarUrl={avatarUrl}
      displayName={[firstName, lastName].filter(Boolean).join(" ")}
      headline={title}
      idPrefix={idPrefix}
      isUploadingAvatar={isUploadingAvatar}
      onAvatarFileSelected={onAvatarFileSelected}
      profileDetails={
        <ProfileFields
          firstName={firstName}
          lastName={lastName}
          title={title}
          company={company}
          contact={contact}
          about={about}
          phone={phone}
          email={email}
          errors={errors}
          idPrefix={`${idPrefix}-details`}
          onFirstNameChange={onFirstNameChange}
          onLastNameChange={onLastNameChange}
          onTitleChange={onTitleChange}
          onCompanyChange={onCompanyChange}
          onContactChange={onContactChange}
          onAboutChange={onAboutChange}
          onPhoneChange={onPhoneChange}
        />
      }
    />
  )
}
