import { redirect } from "next/navigation"

import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { DocumentsTab } from "@/components/organization/org-profile-card/tabs/documents-tab"
import type { OrgDocuments } from "@/components/organization/org-profile-card/types"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

export const dynamic = "force-dynamic"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

export default async function MyOrganizationDocumentsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/my-organization/documents")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  const documentsRaw = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : null

  const parseDocument = (key: keyof OrgDocuments) => {
    const raw = documentsRaw && isRecord(documentsRaw[key]) ? (documentsRaw[key] as Record<string, unknown>) : null
    if (!raw) return null
    return {
      name: String(raw["name"] ?? ""),
      path: String(raw["path"] ?? ""),
      size: typeof raw["size"] === "number" ? (raw["size"] as number) : null,
      mime: typeof raw["mime"] === "string" ? (raw["mime"] as string) : null,
      updatedAt: typeof raw["updatedAt"] === "string" ? (raw["updatedAt"] as string) : null,
    }
  }

  const parsedDocuments: OrgDocuments = {
    verificationLetter: parseDocument("verificationLetter"),
    articlesOfIncorporation: parseDocument("articlesOfIncorporation"),
    bylaws: parseDocument("bylaws"),
    stateRegistration: parseDocument("stateRegistration"),
    goodStandingCertificate: parseDocument("goodStandingCertificate"),
    w9: parseDocument("w9"),
    taxExemptCertificate: parseDocument("taxExemptCertificate"),
  }

  const hasAnyDocument = Object.values(parsedDocuments).some((doc) => Boolean(doc?.path))
  const documents = hasAnyDocument ? parsedDocuments : null

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageTutorialButton tutorial="documents" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload private PDF files for your organization. These are never shared publicly.
        </p>
      </div>
      <DocumentsTab documents={documents} editMode={canEdit} canEdit={canEdit} />
    </div>
  )
}
