import { validatePublicHandle } from "./handles"

export type PublicPersonDirectoryEntry = {
  handle: string
  name: string
  headline: string | null
  location: string | null
  avatarUrl: string | null
  href: string
}

type PublishedPersonRow = {
  profile_id: string
  display_name: string
  headline: string | null
  location_label: string | null
  avatar_url: string | null
  is_public: boolean
}

type PersonHandleRow = {
  profile_id: string | null
  owner_type: string
  handle: string
}

function publicImageUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

/** Explicit projection: account data and publication flags never reach the directory. */
export function projectPublicPeople(
  people: PublishedPersonRow[],
  handles: PersonHandleRow[]
): PublicPersonDirectoryEntry[] {
  const handlesByPerson = new Map(
    handles
      .filter(
        (row) =>
          row.owner_type === "person" &&
          row.profile_id &&
          validatePublicHandle(row.handle).valid
      )
      .map((row) => [row.profile_id, validatePublicHandle(row.handle).handle])
  )

  return people.flatMap((person) => {
    const handle = handlesByPerson.get(person.profile_id)
    if (!person.is_public || !handle || !person.display_name.trim()) return []
    return [
      {
        handle,
        name: person.display_name,
        headline: person.headline,
        location: person.location_label,
        avatarUrl: publicImageUrl(person.avatar_url),
        href: `/${handle}`,
      },
    ]
  })
}
