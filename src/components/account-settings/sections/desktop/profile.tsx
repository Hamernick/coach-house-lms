import Image from "next/image"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccountSettingsErrorKey } from "../../types"

export type ProfileSectionProps = {
  avatarUrl: string | null
  firstName: string
  lastName: string
  phone: string
  email: string
  errors: Partial<Record<AccountSettingsErrorKey, string>>
  isUploadingAvatar: boolean
  onAvatarFileSelected: (file?: File | null) => void
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
}

export function ProfileSection({
  avatarUrl,
  firstName,
  lastName,
  phone,
  email,
  errors,
  isUploadingAvatar,
  onAvatarFileSelected,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
}: ProfileSectionProps) {
  const initials = `${(firstName.charAt(0) || "A").toUpperCase()}${(lastName.charAt(0) || "A").toUpperCase()}`

  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="text-sm text-muted-foreground">Update your personal details.</p>
      </header>
      <div className="max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
          <div
            className="relative size-16 overflow-hidden rounded-full border border-border bg-card sm:size-20"
            aria-busy={isUploadingAvatar}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {initials}
              </div>
            )}
            {isUploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="size-6 animate-spin" aria-hidden />
              </div>
            ) : null}
          </div>
          <Label htmlFor="avatarUpload" className="text-xs text-muted-foreground">
            Upload a profile picture (optional)
          </Label>
          <Input
            id="avatarUpload"
            type="file"
            accept="image/*"
            className="max-w-xs"
            disabled={isUploadingAvatar}
            onChange={(event) => onAvatarFileSelected(event.currentTarget.files?.[0] ?? null)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="first">First name</Label>
            <Input
              id="first"
              placeholder="First name"
              value={firstName}
              aria-invalid={Boolean(errors?.firstName)}
              onChange={(event) => onFirstNameChange(event.currentTarget.value)}
            />
            {errors?.firstName ? <p className="text-xs text-destructive">{errors.firstName}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last">Last name</Label>
            <Input
              id="last"
              placeholder="Last name"
              value={lastName}
              aria-invalid={Boolean(errors?.lastName)}
              onChange={(event) => onLastNameChange(event.currentTarget.value)}
            />
            {errors?.lastName ? <p className="text-xs text-destructive">{errors.lastName}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} aria-invalid={Boolean(errors?.phone)} onChange={(event) => onPhoneChange(event.currentTarget.value)} />
            {errors?.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
        </div>
      </div>
    </div>
  )
}
