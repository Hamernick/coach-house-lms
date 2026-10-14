import "server-only"
import { organizationDocumentCollaborationEnabled } from "@/lib/feature-flags"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { resolveOrganizationDocumentAccess } from "@/lib/organization/document-access"
import { requireOrganizationDocumentStorage } from "@/lib/organization/document-storage-access"
import { canEditOrganization } from "@/lib/organization/active-org"
import type { DocumentScope } from "../types"

export async function documentContext(scope: DocumentScope, write = false) {
  if (!organizationDocumentCollaborationEnabled) throw new Error("Document collaboration is not enabled yet.")
  if (!/^[0-9a-f-]{36}$/i.test(scope.organizationId) || !/^[a-zA-Z0-9_-]{1,160}$/.test(scope.sectionId)) throw new Error("Invalid document.")
  const client = await createSupabaseServerClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error("Sign in again to access this document.")
  const access = await resolveOrganizationDocumentAccess(client, user.id, scope.organizationId)
  if ("error" in access) throw new Error(access.error || "Document access denied.")
  if (write) {
    if (!canEditOrganization(access.role)) throw new Error("This document is read-only.")
    const storage = "supportAccess" in access && access.supportAccess ? { ok: true } : await requireOrganizationDocumentStorage({ supabase: access.supabase, orgId: scope.organizationId })
    if ("error" in storage) throw new Error(storage.error)
  }
  return { user, client, admin: createSupabaseAdminClient({ actorId: user.id }) as SupabaseClient, role: "staffAccessLevel" in access ? access.staffAccessLevel === "coach" ? "Coach" : "Coach House admin" : access.role }
}
