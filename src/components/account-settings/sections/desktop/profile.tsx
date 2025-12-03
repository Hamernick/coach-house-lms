import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="text-sm text-muted-foreground">Update your personal details.</p>
      </header>
      <div className="grid max-w-xl gap-4">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative size-24 overflow-hidden rounded-full border border-border bg-card sm:size-28" aria-busy={isUploadingAvatar}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="112px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {(firstName.charAt(0) || "A").toUpperCase()}
                {(lastName.charAt(0) || "A").toUpperCase()}
              </div>
            )}
            {isUploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="size-6 animate-spin" aria-hidden />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="avatarUpload" className={isUploadingAvatar ? "cursor-pointer pointer-events-none opacity-60" : "cursor-pointer"}>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onAvatarFileSelected(event.currentTarget.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" size="sm" disabled={isUploadingAvatar} asChild>
                <span className="inline-flex items-center gap-2">
                  {isUploadingAvatar ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {isUploadingAvatar ? "Uploading..." : "Add photo"}
                </span>
              </Button>
            </label>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="first">First name</Label>
            <Input id="first" value={firstName} aria-invalid={Boolean(errors?.firstName)} onChange={(event) => onFirstNameChange(event.currentTarget.value)} />
            {errors?.firstName ? <p className="text-xs text-destructive">{errors.firstName}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last">Last name</Label>
            <Input id="last" value={lastName} aria-invalid={Boolean(errors?.lastName)} onChange={(event) => onLastNameChange(event.currentTarget.value)} />
            {errors?.lastName ? <p className="text-xs text-destructive">{errors.lastName}</p> : null}
          </div>
        </div>
        <div className="mt-2 grid gap-2">
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
  )
}
