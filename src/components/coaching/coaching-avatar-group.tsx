import Image from "next/image"
import UserRoundIcon from "lucide-react/dist/esm/icons/user-round"

import { cn } from "@/lib/utils"

type AvatarSize = "xs" | "sm" | "md"

type CoachingAvatarGroupProps = {
  className?: string
  size?: AvatarSize
  label?: string
}

const COACHING_TEAM_AVATARS: Array<{
  id: string
  name: string
  imageUrl: string | null
}> = [
  {
    id: "frank",
    name: "Frank",
    imageUrl:
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Frank.PNG",
  },
  {
    id: "paula",
    name: "Paula",
    imageUrl:
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Paula.png",
  },
  {
    id: "joel",
    name: "Joel",
    imageUrl:
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Joel.png",
  },
]

const SIZE_STYLES: Record<
  AvatarSize,
  { avatar: string; icon: string; sizes: string }
> = {
  xs: { avatar: "h-6 w-6", icon: "h-3 w-3", sizes: "24px" },
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
      <ul
        role="list"
        aria-label={label}
        className={cn(
          "flex items-center",
          size === "xs" ? "-space-x-1.5" : "-space-x-2"
        )}
      >
        {COACHING_TEAM_AVATARS.map((avatar) => (
          <li
            key={avatar.id}
            className={cn(
              "border-background ring-border/70 relative overflow-hidden rounded-full border-2 ring-1",
              styles.avatar
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
                className="bg-muted text-muted-foreground inline-flex h-full w-full items-center justify-center"
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
