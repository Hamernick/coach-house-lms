import Image from "next/image"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProfileAvatarFieldProps = {
  avatarUrl: string | null
  initials: string
  isUploadingAvatar: boolean
  inputId: string
  onAvatarFileSelected: (file?: File | null) => void
}

export function ProfileAvatarField({
  avatarUrl,
  initials,
  isUploadingAvatar,
  inputId,
  onAvatarFileSelected,
}: ProfileAvatarFieldProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center">
        <div
          className="relative size-16 overflow-hidden rounded-full border border-border bg-card sm:size-20"
          aria-busy={isUploadingAvatar}
        >
          {avatarUrl ? (
            <Image key={avatarUrl} src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="80px" unoptimized />
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

        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>Profile photo</Label>
          <Input
            id={inputId}
            type="file"
            accept="image/*"
            className="max-w-xs"
            disabled={isUploadingAvatar}
            onChange={(event) => onAvatarFileSelected(event.currentTarget.files?.[0] ?? null)}
          />
          <FieldDescription>Optional. Square images work best.</FieldDescription>
        </div>
      </div>
    </div>
  )
}
