import Image from "next/image"
import UserRoundIcon from "lucide-react/dist/esm/icons/user-round"

import { cn } from "@/lib/utils"

type AvatarSize = "sm" | "md"

type CoachingAvatarGroupProps = {
  className?: string
  size?: AvatarSize
  label?: string
}

const COACHING_TEAM_AVATARS: Array<{ id: string; name: string; imageUrl: string | null }> = [
  { id: "placeholder", name: "Coach slot available", imageUrl: null },
  {
    id: "paula",
    name: "Paula",
    imageUrl: "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Paula.png",
  },
  {
    id: "joel",
    name: "Joel",
    imageUrl: "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Joel.png",
  },
]

const SIZE_STYLES: Record<AvatarSize, { avatar: string; icon: string; sizes: string }> = {
  sm: { avatar: "h-8 w-8", icon: "h-3.5 w-3.5", sizes: "32px" },
  md: { avatar: "h-10 w-10", icon: "h-4 w-4", sizes: "40px" },
}

export function CoachingAvatarGroup({
  className,
  size = "sm",
  label = "Coach House coaching team",
}: CoachingAvatarGroupProps) {
  const styles = SIZE_STYLES[size]

  return (
    <div className={cn("inline-flex items-center", className)}>
      <ul role="list" aria-label={label} className="flex items-center -space-x-2">
        {COACHING_TEAM_AVATARS.map((avatar) => (
          <li
            key={avatar.id}
            className={cn(
              "relative overflow-hidden rounded-full border-2 border-background ring-1 ring-border/70",
              styles.avatar,
            )}
          >
            {avatar.imageUrl ? (
              <Image
                src={avatar.imageUrl}
                alt={avatar.name}
                fill
                sizes={styles.sizes}
                className="object-cover"
              />
            ) : (
              <span
                className="inline-flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
                aria-label={avatar.name}
              >
                <UserRoundIcon className={styles.icon} aria-hidden />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
