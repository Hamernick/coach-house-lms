import "server-only"

import {
  projectPublicPeople,
  type PublicPersonDirectoryEntry,
} from "@/features/public-profiles"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type PublicPeopleDirectory = {
  status: "ready" | "unavailable"
  people: PublicPersonDirectoryEntry[]
  hasMore: boolean
  page: number
}

const DIRECTORY_LIMIT = 24

export async function fetchPublicPeopleDirectory(
  requestedPage = 1
): Promise<PublicPeopleDirectory> {
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 10000)
      : 1
  const offset = (page - 1) * DIRECTORY_LIMIT
  try {
    const supabase = await createSupabaseServerClient()
    const { data: people, error } = await supabase
      .from("public_person_profiles")
      .select(
        "profile_id, display_name, headline, location_label, avatar_url, is_public"
      )
      .eq("is_public", true)
      .order("display_name")
      .order("profile_id")
      .range(offset, offset + DIRECTORY_LIMIT)
    if (error) throw error
    if (!people?.length)
      return { status: "ready", people: [], hasMore: false, page }

    const { data: handles, error: handleError } = await supabase
      .from("public_handles")
      .select("profile_id, owner_type, handle")
      .eq("owner_type", "person")
      .in(
        "profile_id",
        people.slice(0, DIRECTORY_LIMIT).map((person) => person.profile_id)
      )
    if (handleError) throw handleError
    return {
      status: "ready",
      people: projectPublicPeople(
        people.slice(0, DIRECTORY_LIMIT),
        handles ?? []
      ),
      hasMore: people.length > DIRECTORY_LIMIT,
      page,
    }
  } catch {
    return { status: "unavailable", people: [], hasMore: false, page }
  }
}
