import { redirect } from "next/navigation"

import { OrgProgressCards } from "@/components/organization/org-progress-cards"
import { OrgProfileCard } from "@/components/organization/org-profile-card"
import { createSupabaseServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function MyOrganizationPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/my-organization")

  // Load organization profile for the current user
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("ein, profile")
    .eq("user_id", user.id)
    .maybeSingle<{ ein: string | null; profile: Record<string, unknown> | null }>()

  const initialProfile = {
    name: String(orgRow?.profile?.["name"] ?? ""),
    entity: String(orgRow?.profile?.["entity"] ?? ""),
    ein: String(orgRow?.ein ?? orgRow?.profile?.["ein"] ?? ""),
    incorporation: String(orgRow?.profile?.["incorporation"] ?? ""),
    rep: String(orgRow?.profile?.["rep"] ?? ""),
    phone: String(orgRow?.profile?.["phone"] ?? ""),
    address: String(orgRow?.profile?.["address"] ?? ""),
    coverUrl: String(orgRow?.profile?.["coverUrl"] ?? ""),
    logoUrl: String(orgRow?.profile?.["logoUrl"] ?? ""),
    publicUrl: String(orgRow?.profile?.["publicUrl"] ?? ""),
    twitter: String(orgRow?.profile?.["twitter"] ?? ""),
    facebook: String(orgRow?.profile?.["facebook"] ?? ""),
    linkedin: String(orgRow?.profile?.["linkedin"] ?? ""),
    vision: String(orgRow?.profile?.["vision"] ?? ""),
    mission: String(orgRow?.profile?.["mission"] ?? ""),
    need: String(orgRow?.profile?.["need"] ?? ""),
    values: String(orgRow?.profile?.["values"] ?? ""),
    people: String(orgRow?.profile?.["people"] ?? ""),
    programs: String(orgRow?.profile?.["programs"] ?? ""),
    reports: String(orgRow?.profile?.["reports"] ?? ""),
    toolkit: String(orgRow?.profile?.["toolkit"] ?? ""),
    supporters: String(orgRow?.profile?.["supporters"] ?? ""),
    readinessScore: String(orgRow?.profile?.["readiness_score"] ?? ""),
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <section>
        <OrgProgressCards userId={user.id} />
      </section>
      <section>
        <OrgProfileCard initial={initialProfile} />
      </section>
    </div>
  )
}
