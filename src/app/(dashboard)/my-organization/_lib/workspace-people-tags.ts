import type { SupabaseClient } from "@supabase/supabase-js"

import {
  normalizeOrganizationPeopleTagColor,
  type OrganizationPeopleTag,
} from "@/lib/people/tags"
import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"

export async function loadOrganizationPeopleTags({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: SupabaseClient<Database, "public">
}): Promise<OrganizationPeopleTag[]> {
  const tagsResult = await supabase
    .from("organization_people_tags")
    .select("id,label,color")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Array<{ id: string; label: string; color: string }>>()

  if (tagsResult.error) {
    throw supabaseErrorToError(tagsResult.error, "Unable to load people tags.")
  }
  if (tagsResult.data.length === 0) return []

  const tagIds = tagsResult.data.map((tag) => tag.id)
  const membersResult = await supabase
    .from("organization_people_tag_members")
    .select("tag_id,person_id")
    .in("tag_id", tagIds)
    .returns<Array<{ tag_id: string; person_id: string }>>()
  if (membersResult.error) {
    throw supabaseErrorToError(
      membersResult.error,
      "Unable to load people tag members."
    )
  }

  const memberIdsByTag = new Map<string, string[]>()
  for (const member of membersResult.data) {
    const current = memberIdsByTag.get(member.tag_id) ?? []
    current.push(member.person_id)
    memberIdsByTag.set(member.tag_id, current)
  }

  return tagsResult.data.map((tag) => ({
    id: tag.id,
    label: tag.label,
    color: normalizeOrganizationPeopleTagColor(tag.color),
    memberIds: memberIdsByTag.get(tag.id) ?? [],
  }))
}
