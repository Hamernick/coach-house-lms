import type { SupabaseClient } from "@supabase/supabase-js"

import { htmlToMarkdown } from "@/lib/markdown/convert"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import type { Database } from "@/lib/supabase"
import { isMissingOrganizationProjectOverviewDocumentsTableError } from "./table-errors"

export type MemberWorkspaceProjectOverviewDocumentRecord = Pick<
  Database["public"]["Tables"]["organization_project_overview_documents"]["Row"],
  | "id"
  | "org_id"
  | "project_id"
  | "document_html"
  | "document_text"
  | "updated_at"
>

type MemberWorkspaceProjectOverviewDocumentClient = Pick<
  SupabaseClient<Database, "public">,
  "from"
>

function toDocumentText(documentHtml: string) {
  return htmlToMarkdown(documentHtml).trim()
}

export function normalizeProjectOverviewDocumentHtml(
  value: string | null | undefined
) {
  return sanitizeHtml(value?.trim() ?? "").trim()
}

export async function loadProjectOverviewDocument({
  orgId,
  projectId,
  supabase,
}: {
  orgId: string
  projectId: string
  supabase: MemberWorkspaceProjectOverviewDocumentClient
}) {
  const { data, error } = await supabase
    .from("organization_project_overview_documents")
    .select("id, org_id, project_id, document_html, document_text, updated_at")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .maybeSingle<MemberWorkspaceProjectOverviewDocumentRecord>()

  if (error) {
    if (isMissingOrganizationProjectOverviewDocumentsTableError(error)) {
      return null
    }

    throw error
  }

  return data ?? null
}

export async function upsertProjectOverviewDocument({
  actorId,
  documentHtml,
  orgId,
  projectId,
  supabase,
}: {
  actorId: string
  documentHtml: string
  orgId: string
  projectId: string
  supabase: MemberWorkspaceProjectOverviewDocumentClient
}) {
  const normalizedDocumentHtml =
    normalizeProjectOverviewDocumentHtml(documentHtml)

  const { data: existingDocument, error: existingDocumentError } =
    await supabase
      .from("organization_project_overview_documents")
      .select("id")
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .maybeSingle<{ id: string }>()

  if (existingDocumentError) {
    return existingDocumentError
  }

  if (existingDocument) {
    const { error } = await supabase
      .from("organization_project_overview_documents")
      .update({
        document_html: normalizedDocumentHtml,
        document_text: toDocumentText(normalizedDocumentHtml),
        updated_by: actorId,
      })
      .eq("id", existingDocument.id)

    return error
  }

  const { error } = await supabase
    .from("organization_project_overview_documents")
    .insert({
      org_id: orgId,
      project_id: projectId,
      document_html: normalizedDocumentHtml,
      document_text: toDocumentText(normalizedDocumentHtml),
      created_by: actorId,
      updated_by: actorId,
    })

  return error
}
