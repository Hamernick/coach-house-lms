import { requirePlatformCapability } from "@/lib/admin/auth"
import { resolveStaffProgramAccess } from "@/lib/programs/staff-access"
import type { OrgProgram } from "@/components/organization/org-profile-card/types"

export async function loadOrganizationPrograms(organizationId: string): Promise<OrgProgram[]> {
  const staff = await requirePlatformCapability("organizations", { loginRedirect: "/organizations" })
  const access = await resolveStaffProgramAccess({ organizationId, userId: staff.userId, accessLevel: staff.accessLevel })
  if ("error" in access) throw new Error("Unable to access organization programs.")
  const { data, error } = await access.supabase.from("programs").select("*")
    .eq("user_id", access.orgId).order("created_at", { ascending: false })
  if (error) throw new Error("Unable to load organization programs.")
  return (data ?? []).map((program) => ({
    ...program,
    location_type: program.location_type === "online" ? "online" : "in_person",
    wizard_snapshot: program.wizard_snapshot && typeof program.wizard_snapshot === "object" && !Array.isArray(program.wizard_snapshot)
      ? program.wizard_snapshot : null,
  }))
}
