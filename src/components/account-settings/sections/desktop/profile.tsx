import type { AccountSettingsErrorKey } from "../../types"
import { ProfileFields } from "../profile-fields"

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
    <div className="flex flex-col gap-6">
      <header>
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="text-sm text-muted-foreground">Update your personal and internal member profile details.</p>
      </header>
      <ProfileFields
        avatarUrl={avatarUrl}
        firstName={firstName}
        lastName={lastName}
        title={title}
        company={company}
        contact={contact}
        about={about}
        phone={phone}
        email={email}
        errors={errors}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarFileSelected={onAvatarFileSelected}
        onFirstNameChange={onFirstNameChange}
        onLastNameChange={onLastNameChange}
        onTitleChange={onTitleChange}
        onCompanyChange={onCompanyChange}
        onContactChange={onContactChange}
        onAboutChange={onAboutChange}
        onPhoneChange={onPhoneChange}
      />
    </div>
  )
}
