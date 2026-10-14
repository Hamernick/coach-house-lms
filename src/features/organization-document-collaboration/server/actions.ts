"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath, revalidateTag } from "next/cache"
import { normalizeRoadmapBudgetRows, roadmapBudgetRowsEqual } from "@/lib/roadmap/budget"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { resolveRoadmapSections, updateRoadmapSection, getRoadmapWorkspaceRevalidationPaths } from "@/lib/roadmap"
import { documentContext } from "./context"
import { applyDocumentSteps } from "../lib"
import { documentSchema, serializeDocument, validateDocument } from "../lib/schema"
import type { DocumentScope, DocumentSession, DocumentSyncInput, DocumentSyncResult, DocumentVersion } from "../types"

function message(error: unknown) {
  return error instanceof Error ? error.message : "Unable to sync. Your edits remain in this editor."
}

export async function syncOrganizationDocument(input: DocumentSyncInput): Promise<DocumentSyncResult> {
  try {
    if (JSON.stringify(input).length > 1_000_000) throw new Error("Document request is too large.")
    const writing = Boolean(input.steps?.length || input.initialDocument || input.budget)
    const { user, admin, client, role } = await documentContext(input, writing)
    if (!input.clientId.startsWith(`${user.id}:`) || input.clientId.length > 100) throw new Error("Invalid editing session.")
    if (!Number.isInteger(input.version) || input.version < 0) throw new Error("Invalid document revision.")
    for (let attempt = 0; attempt < 3; attempt++) {
      const [organization, stored] = await Promise.all([
        admin.from("organizations").select("profile,updated_at,public_slug").eq("user_id", input.organizationId).single(),
        admin.from("organization_core_document_sessions").select("generation,version,document,steps,section_revision,section_content")
          .eq("org_id", input.organizationId).eq("section_id", input.sectionId).maybeSingle(),
      ])
      if (organization.error || stored.error) throw new Error("Document collaboration is unavailable. Keep this editor open and try again.")
      const profile = organization.data.profile ?? {}
      const section = resolveRoadmapSections(profile).find(item => item.id === input.sectionId)
      if (!section) throw new Error("Document no longer exists. Your local edits have not been discarded.")
      if (section.driveSource) throw new Error("This document is now connected to Google Drive. Your local edits have not been discarded.")
      let session = stored.data as DocumentSession | null
      const invalidated = session && session.section_revision !== section.lastUpdated && session.section_content !== section.content
      if (input.generation && (invalidated || session?.generation !== input.generation)) {
        return { error: "This document changed outside the live editor. Copy your unsaved text before reopening to compare the latest version.", code: "external_change" }
      }
      let nextProfile = null
      let nextSection = section
      let next: DocumentSession | null = invalidated ? null : session
      if (!next && input.initialDocument) {
        if (input.expectedRevision !== section.lastUpdated) return { error: "The document changed while opening. Reopen it to load the latest version.", code: "external_change" }
        const doc = documentSchema.nodeFromJSON(input.initialDocument)
        validateDocument(doc)
        if (doc.content.size > 250_000) throw new Error("Document is too large.")
        next = { generation: randomUUID(), version: 0, document: doc.toJSON(), steps: [], section_revision: section.lastUpdated, section_content: section.content }
      } else if (next && input.generation && input.version === next.version && input.steps?.length) {
        next = applyDocumentSteps(next, input.steps, input.clientId)
        const content = sanitizeHtml(serializeDocument(documentSchema.nodeFromJSON(next.document)))
        const updated = updateRoadmapSection(profile, input.sectionId, { content })
        nextProfile = updated.nextProfile
        nextSection = updated.section
        next.section_revision = nextSection.lastUpdated
        next.section_content = nextSection.content
      }
      if (next && next.section_revision !== nextSection.lastUpdated) next = { ...next, section_revision: nextSection.lastUpdated }
      if (next && input.generation && input.version > next.version) return { error: "Document revision is unavailable. Your edits are retained.", code: "expired" }
      if (next && input.generation === next.generation && input.version === (session?.version ?? 0) && input.budget) {
        if (input.sectionId !== "budget") throw new Error("Budget rows belong to the Budget document.")
        const currentRows = section.budgetRows ?? []
        const nextRows = normalizeRoadmapBudgetRows(input.budget.next)
        if (!roadmapBudgetRowsEqual(currentRows, normalizeRoadmapBudgetRows(input.budget.base))
          && !roadmapBudgetRowsEqual(currentRows, nextRows)) {
          return { error: "Budget rows changed elsewhere. Your edits are still here. Choose which rows to keep.", code: "budget_conflict", savedBudgetRows: currentRows }
        }
        if (!roadmapBudgetRowsEqual(currentRows, nextRows)) {
          const updated = updateRoadmapSection(nextProfile ?? profile, input.sectionId, { budgetRows: nextRows })
          nextProfile = updated.nextProfile
          nextSection = updated.section
          next = { ...next, section_revision: nextSection.lastUpdated }
        }
      }
      if (next && input.generation && input.version < next.version - next.steps.length) {
        return { error: "This editing session is too old to merge safely. Copy any unsaved text before reopening the latest document.", code: "expired" }
      }
      if (next !== session && next) {
        const { data: committed, error } = await admin.rpc("commit_core_document_session", {
          p_org: input.organizationId, p_section: input.sectionId,
          p_expected_updated_at: organization.data.updated_at,
          p_expected_generation: session?.generation ?? null, p_expected_version: session?.version ?? null,
          p_state: next, p_profile: nextProfile,
        })
        if (error) throw new Error("Unable to save. Your edits remain in this editor; retry shortly.")
        if (!committed) continue
        session = next
        if (nextProfile) {
          for (const path of getRoadmapWorkspaceRevalidationPaths({ publicSlug: organization.data.public_slug, sectionSlug: nextSection.slug })) revalidatePath(path)
          revalidatePath("/resources")
          revalidateTag("public-map-organizations", "max")
        }
      } else session = next
      const { data: actor } = await client.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      const selection = input.selection && Number.isInteger(input.selection.anchor) && Number.isInteger(input.selection.head)
        && Number.isInteger(input.selection.version) && input.selection.version >= 0
        && input.selection.anchor >= 0 && input.selection.head >= 0
        ? input.selection : null
      const presence = await admin.from("organization_core_document_presence").upsert({
        org_id: input.organizationId, section_id: input.sectionId, session_id: input.clientId,
        actor_id: user.id, display_name: actor?.full_name?.trim() || "Team member", role, mode: input.steps?.length || input.budget ? "editing" : "viewing",
        selection, seen_at: new Date().toISOString(),
      })
      if (presence.error) throw new Error("Presence is unavailable. Document changes may be saved; reconnect to confirm.")
      const { data: participants, error: presenceError } = await admin.from("organization_core_document_presence")
        .select("session_id,actor_id,display_name,role,mode,selection")
        .eq("org_id", input.organizationId).eq("section_id", input.sectionId)
        .gt("seen_at", new Date(Date.now() - 20_000).toISOString()).limit(50)
      if (presenceError) throw new Error("Unable to confirm who is viewing this document.")
      // Expired rows carry no content. Bound storage without a separate scheduled job.
      await admin.from("organization_core_document_presence").delete().eq("org_id", input.organizationId)
        .lt("seen_at", new Date(Date.now() - 60_000).toISOString())
      const responseSession = session && input.generation === session.generation
        ? { ...session, steps: session.steps.slice(Math.max(0, input.version - (session.version - session.steps.length))) }
        : session
      return { section: nextSection, session: responseSession, participants: participants ?? [], userId: user.id }
    }
    return { error: "Another update is still saving. Your edits are retained; retry shortly." }
  } catch (error) { return { error: message(error) } }
}

export async function loadOrganizationDocumentVersions(scope: DocumentScope): Promise<{ versions: DocumentVersion[] } | { error: string }> {
  try {
    const { admin } = await documentContext(scope)
    const { data, error } = await admin.from("organization_core_document_versions")
      .select("id,created_at,actor_id,content").eq("org_id", scope.organizationId).eq("section_id", scope.sectionId)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(130)
    if (error) throw new Error("Version history is unavailable.")
    const actorIds = [...new Set((data ?? []).flatMap(version => version.actor_id ? [version.actor_id] : []))]
    const { data: actors } = actorIds.length ? await admin.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] }
    const names = new Map((actors ?? []).map(actor => [actor.id, actor.full_name?.trim()]))
    return { versions: (data ?? []).map(version => ({ ...version,
      actor_name: version.actor_id ? names.get(version.actor_id) || "Team member" : "Original" })) }
  } catch (error) { return { error: message(error) } }
}

export async function leaveOrganizationDocument(scope: DocumentScope, clientId: string) {
  try {
    const { user, admin } = await documentContext(scope)
    await admin.from("organization_core_document_presence").delete()
      .eq("org_id", scope.organizationId).eq("section_id", scope.sectionId)
      .eq("session_id", clientId).eq("actor_id", user.id)
  } catch { /* Presence expires even after permission revocation or disconnect. */ }
}
