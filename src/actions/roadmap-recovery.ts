"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { resolveRoadmapSections } from "@/lib/roadmap"

export async function loadRoadmapSectionForRecovery(input: {
  sectionId: string
  organizationId: string
  userId: string
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user || user.id !== input.userId)
    return { error: "Your session changed. Reopen this document." }
  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (orgId !== input.organizationId || !canEditOrganization(role))
    return {
      error: "Your organization or access changed. Reopen this document.",
    }
  const { data, error: readError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (readError)
    return { error: "The saved document could not load. Try again." }
  const section = resolveRoadmapSections(data?.profile ?? {}).find(
    (item) => item.id === input.sectionId
  )
  return section
    ? { section }
    : { error: "This document is no longer available." }
}
