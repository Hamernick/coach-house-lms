import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CoachingCoach, CoachingParticipant } from "../types"

const COACHING_AVATAR_CLASS = "border-background size-10 min-h-10 min-w-10 max-h-10 max-w-10 basis-10 border-2"
const COACHING_AVATAR_IMAGE_CLASS = "block size-full object-cover"
const COACHING_AVATAR_FALLBACK_CLASS = "size-full text-xs font-medium leading-none"

export function SessionAvatarStack({ coaches }: { coaches: CoachingCoach[] }) {
  return (
    <div className="flex -space-x-3">
      {coaches.map((coach) => (
        <Avatar key={coach.id} className={COACHING_AVATAR_CLASS}>
          <AvatarImage src={coach.imageUrl} alt={coach.name} className={COACHING_AVATAR_IMAGE_CLASS} />
          <AvatarFallback className={COACHING_AVATAR_FALLBACK_CLASS}>{coach.initials}</AvatarFallback>
        </Avatar>
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
      className="flex -space-x-3"
      aria-label={`Session participants: ${participants.map((participant) => participant.name).join(", ")}`}
    >
      {participants.map((participant) => (
        <Avatar key={participant.id} className={COACHING_AVATAR_CLASS}>
          {participant.imageUrl ? <AvatarImage src={participant.imageUrl} alt={participant.name} className={COACHING_AVATAR_IMAGE_CLASS} /> : null}
          <AvatarFallback className={COACHING_AVATAR_FALLBACK_CLASS}>{participant.initials}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
