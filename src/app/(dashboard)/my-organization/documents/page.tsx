import { redirect } from "next/navigation"

import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import {
  DocumentsTab,
  type DocumentsOption,
  type DocumentsPolicyEntry,
  type DocumentsRoadmapSection,
} from "@/components/organization/org-profile-card/tabs/documents-tab"
import type { OrgDocuments } from "@/components/organization/org-profile-card/types"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

export const dynamic = "force-dynamic"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const POLICY_STATUSES = new Set(["not_started", "in_progress", "complete"])

const normalizeCategories = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const output: string[] = []
  for (const entry of value) {
    if (typeof entry !== "string") continue
    const category = entry.trim()
    if (!category) continue
    const key = category.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(category)
  }
  return output
}

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
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isAdmin = profileRow?.role === "admin"
  const entitlements = await fetchLearningEntitlements({
    supabase,
    userId: user.id,
    orgUserId: orgId,
    isAdmin,
  })
  const canAccessRoadmapDocuments = entitlements.hasAcceleratorAccess

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile, public_slug")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null; public_slug: string | null }>()

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
    ueiConfirmation: parseDocument("ueiConfirmation"),
    samActiveStatus: parseDocument("samActiveStatus"),
    grantsGovRegistration: parseDocument("grantsGovRegistration"),
    gataPreQualification: parseDocument("gataPreQualification"),
    einConfirmationLetter: parseDocument("einConfirmationLetter"),
    irs990s: parseDocument("irs990s"),
    auditedFinancials: parseDocument("auditedFinancials"),
  }

  const policiesRaw = Array.isArray(profile["policies"])
    ? (profile["policies"] as Array<unknown>)
    : []

  const policyEntries: DocumentsPolicyEntry[] = policiesRaw
    .map((entry) => (isRecord(entry) ? entry : null))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const statusRaw = typeof entry["status"] === "string" ? entry["status"].trim() : ""
      const personIdsRaw = Array.isArray(entry["personIds"]) ? (entry["personIds"] as unknown[]) : []
      const categories = normalizeCategories(entry["categories"])
      if (categories.length === 0 && Boolean(entry["board"])) {
        categories.push("Board")
      }
      const rawDocument = isRecord(entry["document"]) ? (entry["document"] as Record<string, unknown>) : null
      return {
        id: typeof entry["id"] === "string" ? entry["id"] : "",
        title: typeof entry["title"] === "string" ? entry["title"] : "",
        summary: typeof entry["summary"] === "string" ? entry["summary"] : "",
        status: POLICY_STATUSES.has(statusRaw)
          ? (statusRaw as DocumentsPolicyEntry["status"])
          : "not_started",
        categories,
        programId: typeof entry["programId"] === "string" ? entry["programId"] : null,
        personIds: personIdsRaw.filter((value): value is string => typeof value === "string"),
        document:
          rawDocument && typeof rawDocument["path"] === "string" && rawDocument["path"].length > 0
            ? {
                name: typeof rawDocument["name"] === "string" ? rawDocument["name"] : "",
                path: rawDocument["path"],
                size: typeof rawDocument["size"] === "number" ? rawDocument["size"] : null,
                mime: typeof rawDocument["mime"] === "string" ? rawDocument["mime"] : null,
                updatedAt:
                  typeof rawDocument["updatedAt"] === "string" ? rawDocument["updatedAt"] : null,
              }
            : null,
        updatedAt: typeof entry["updatedAt"] === "string" ? entry["updatedAt"] : null,
      }
    })
    .filter((entry) => entry.id.trim().length > 0 && entry.title.trim().length > 0)

  const policyProgramOptions: DocumentsOption[] = ((await supabase
    .from("programs")
    .select("id,title")
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })
    .returns<Array<{ id: string; title: string | null }>>()).data ?? [])
    .map((program) => ({
      id: program.id,
      label: typeof program.title === "string" && program.title.trim().length > 0 ? program.title : "Untitled program",
    }))

  const policyPeopleOptions: DocumentsOption[] = (Array.isArray(profile["org_people"])
    ? (profile["org_people"] as Array<unknown>)
    : [])
    .map((entry) => (isRecord(entry) ? entry : null))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => ({
      id: typeof entry["id"] === "string" ? entry["id"] : "",
      label: typeof entry["name"] === "string" && entry["name"].trim().length > 0 ? entry["name"] : "Unnamed person",
    }))
    .filter((entry) => entry.id.trim().length > 0)

  const roadmapSections: DocumentsRoadmapSection[] = canAccessRoadmapDocuments
    ? resolveRoadmapSections(profile).map((section) => ({
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        slug: section.slug,
        status: section.status,
        lastUpdated: section.lastUpdated,
        isPublic: section.isPublic,
      }))
    : []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageTutorialButton tutorial="documents" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          {canAccessRoadmapDocuments
            ? "Keep roadmap sections and organization files organized in one secure filing system."
            : "Keep organization files organized in one secure filing system."}
        </p>
      </div>
      <DocumentsTab
        userId={user.id}
        documents={parsedDocuments}
        policyEntries={policyEntries}
        policyProgramOptions={policyProgramOptions}
        policyPeopleOptions={policyPeopleOptions}
        roadmapSections={roadmapSections}
        publicSlug={orgRow?.public_slug ?? null}
        editMode={canEdit}
        canEdit={canEdit}
      />
    </div>
  )
}
