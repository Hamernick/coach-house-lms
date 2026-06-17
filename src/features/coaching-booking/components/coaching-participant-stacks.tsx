import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CoachingCoach, CoachingParticipant } from "../types"

type CoachingAvatarPerson = {
  id: string
  name: string
  initials: string
  imageUrl?: string | null
}

const COACHING_AVATAR_CLASS =
  "border-background size-10 min-h-10 min-w-10 max-h-10 max-w-10 basis-10 border-2 outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
const COACHING_REVIEW_AVATAR_CLASS =
  "border-background size-9 min-h-9 min-w-9 max-h-9 max-w-9 basis-9 border-2 outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
const COACHING_AVATAR_IMAGE_CLASS = "block size-full object-cover"
const COACHING_AVATAR_FALLBACK_CLASS = "size-full text-xs font-medium leading-none"
const COACHING_REVIEW_AVATAR_FALLBACK_CLASS = "size-full text-[11px] font-medium leading-none"

function getFirstName(name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) return name
  return trimmedName.split(/\s+/)[0] ?? trimmedName
}

function CoachingTooltipAvatar({
  person,
  avatarClassName,
  fallbackClassName,
}: {
  person: CoachingAvatarPerson
  avatarClassName: string
  fallbackClassName: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar tabIndex={0} aria-label={person.name} className={avatarClassName}>
          {person.imageUrl ? (
            <AvatarImage src={person.imageUrl} alt={person.name} className={COACHING_AVATAR_IMAGE_CLASS} />
          ) : null}
          <AvatarFallback className={fallbackClassName}>{person.initials}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="text-xs font-medium">
        {getFirstName(person.name)}
      </TooltipContent>
    </Tooltip>
  )
}

export function SessionAvatarStack({ coaches }: { coaches: CoachingCoach[] }) {
  return (
    <div className="flex -space-x-3">
      {coaches.map((coach) => (
        <CoachingTooltipAvatar
          key={coach.id}
          person={coach}
          avatarClassName={COACHING_AVATAR_CLASS}
          fallbackClassName={COACHING_AVATAR_FALLBACK_CLASS}
        />
      ))}
    </div>
  )
}

export function BookingParticipantStack({
  coaches,
  currentUser,
}: {
  coaches: CoachingCoach[]
  currentUser: CoachingParticipant
}) {
  const participants = [
    ...coaches.map((coach) => ({
      id: coach.id,
      name: coach.name,
      initials: coach.initials,
      imageUrl: coach.imageUrl,
    })),
    {
      id: "current-user",
      name: currentUser.name,
      initials: currentUser.initials,
      imageUrl: currentUser.imageUrl,
    },
  ]

  return (
    <div
      className="mx-auto flex -space-x-2.5"
      aria-label={`Meeting participants: ${participants.map((participant) => participant.name).join(", ")}`}
    >
      {participants.map((participant) => (
        <CoachingTooltipAvatar
          key={participant.id}
          person={participant}
          avatarClassName={COACHING_REVIEW_AVATAR_CLASS}
          fallbackClassName={COACHING_REVIEW_AVATAR_FALLBACK_CLASS}
        />
      ))}
    </div>
  )
}
