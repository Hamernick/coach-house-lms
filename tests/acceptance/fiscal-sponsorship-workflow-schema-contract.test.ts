import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship workflow schema contract", () => {
  it("adds a secure org/project scoped application table contract", () => {
    const migration = readSource(
      "supabase/migrations/20260609154000_add_fiscal_sponsorship_applications.sql"
    )
    const schemaIndex = readSource("src/lib/supabase/schema/tables/index.ts")
    const schemaTable = readSource(
      "src/lib/supabase/schema/tables/fiscal_sponsorship_applications.ts"
    )

    expect(migration).toContain(
      "create table if not exists public.fiscal_sponsorship_applications"
    )
    expect(migration).toContain("references public.organization_projects(id)")
    expect(migration).toContain(
      "constraint fiscal_sponsorship_applications_project_key unique (org_id, project_id)"
    )
    expect(migration).toContain(
      "alter table public.fiscal_sponsorship_applications enable row level security"
    )
    expect(migration).toContain(
      "alter table public.fiscal_sponsorship_applications force row level security"
    )
    expect(migration).toContain("(select auth.uid())")
    expect(migration).toContain("om.role in ('admin', 'staff')")
    expect(migration).toContain(
      "op.org_id = fiscal_sponsorship_applications.org_id"
    )
    expect(migration).not.toContain(
      'create policy "fiscal_sponsorship_applications_delete"'
    )
    expect(schemaIndex).toContain("FiscalSponsorshipApplicationsTable")
    expect(schemaIndex).toContain("fiscal_sponsorship_applications:")
    expect(schemaTable).toContain("applicant_full_name")
    expect(schemaTable).toContain("estimated_budget_cents")
    expect(schemaTable).toContain("document_template_payload")
  })

  it("adds review, document, signature packet, event, notification, and upload contracts", () => {
    const migration = readSource(
      "supabase/migrations/20260610180000_add_fiscal_sponsorship_workflow.sql"
    )
    const documentMetadataMigration = readSource(
      "supabase/migrations/20260615130000_add_fiscal_sponsorship_required_document_metadata.sql"
    )
    const nativeSigningMigration = readSource(
      "supabase/migrations/20260716150000_add_native_fiscal_sponsorship_signing.sql"
    )
    const schemaIndex = readSource("src/lib/supabase/schema/tables/index.ts")
    const documentSchema = readSource(
      "src/lib/supabase/schema/tables/fiscal_sponsorship_documents.ts"
    )
    const actions = readSource(
      "src/features/fiscal-sponsorship/server/workflow-actions.ts"
    )
    const agreementActions = readSource(
      "src/features/fiscal-sponsorship/server/workflow-agreement-actions.ts"
    )
    const actionFacade = readSource(
      "src/features/fiscal-sponsorship/actions.ts"
    )
    const docusealWebhook = readSource(
      "src/features/fiscal-sponsorship/server/docuseal-webhook.ts"
    )
    const workflowNotifications = readSource(
      "src/features/fiscal-sponsorship/server/workflow-notifications.ts"
    )
    const workflowSummary = readSource(
      "src/features/fiscal-sponsorship/server/workflow-summary.ts"
    )
    const workflowEventSummary = readSource(
      "src/features/fiscal-sponsorship/server/workflow-event-summary.ts"
    )
    const projectAssetsRouteSupport = readSource(
      "src/app/api/account/project-assets/route-support.ts"
    )
    const projectAssetsRoute = readSource(
      "src/app/api/account/project-assets/route.ts"
    )

    expect(migration).toContain(
      "create table if not exists public.fiscal_sponsorship_reviews"
    )
    expect(migration).toContain(
      "create table if not exists public.fiscal_sponsorship_documents"
    )
    expect(migration).toContain(
      "create table if not exists public.fiscal_sponsorship_signature_packets"
    )
    expect(migration).toContain(
      "create table if not exists public.fiscal_sponsorship_events"
    )
    expect(migration).toContain("force row level security")
    expect(migration).toContain("with check (public.is_admin())")
    expect(migration).toContain("source_snapshot jsonb not null")
    expect(migration).toContain("executed_document_id")

    expect(documentMetadataMigration).toContain("document_key text")
    expect(documentMetadataMigration).toContain("review_status text")
    expect(documentMetadataMigration).toContain("uploaded_by uuid")
    expect(documentMetadataMigration).toContain("reviewed_by uuid")
    expect(documentMetadataMigration).toContain("tax_id_confirmation")
    expect(documentMetadataMigration).toContain("grant_request_support")
    expect(documentMetadataMigration).toContain("grantee_report")
    expect(documentMetadataMigration).toContain("closeout_report")
    expect(documentMetadataMigration).toContain(
      "fiscal_sponsorship_documents_application_document_key_idx"
    )
    expect(documentMetadataMigration).toContain(
      "om.role in ('owner', 'admin', 'staff')"
    )
    expect(documentMetadataMigration).not.toContain(
      "om.role in ('admin', 'staff')"
    )

    expect(schemaIndex).toContain("FiscalSponsorshipReviewsTable")
    expect(schemaIndex).toContain("fiscal_sponsorship_documents:")
    expect(schemaIndex).toContain("fiscal_sponsorship_signature_packets:")
    expect(schemaIndex).toContain("fiscal_sponsorship_events:")
    expect(documentSchema).toContain("document_key")
    expect(documentSchema).toContain("review_status")
    expect(documentSchema).toContain("review_notes")

    expect(actions).toContain("submitFiscalSponsorshipApplication")
    expect(actions).toContain("reviewFiscalSponsorshipApplication")
    expect(actions).toContain("connectFiscalSponsorshipDocumentAsset")
    expect(actions).toContain("reviewFiscalSponsorshipDocument")
    expect(actions).toContain("document_connected")
    expect(actions).toContain("document_reviewed")
    expect(actions).toContain("getRequiredReviewNoteError")
    expect(actions).toContain(
      "Add a review note before marking this ${subject}"
    )
    expect(actions).toContain('subject: "application"')
    expect(actions).toContain('subject: "document"')
    expect(actions).toContain("review_notes: reviewNotes")
    expect(actions).toContain("canCoachManageFiscalSponsorship")
    expect(agreementActions).toContain("generateFiscalSponsorshipAgreement")
    expect(agreementActions).toContain(
      "sendFiscalSponsorshipAgreementForSignature"
    )
    expect(agreementActions).toContain("buildFiscalSponsorshipFormBPdf")
    expect(agreementActions).toContain('provider: "native"')
    expect(agreementActions).not.toContain(
      "createFiscalSponsorshipDocuSealSubmission"
    )
    expect(agreementActions).toContain("notifyFiscalAgreementGenerated")
    expect(agreementActions).toContain("notifyFiscalAgreementSent")
    expect(actionFacade).toContain(
      "loadFiscalSponsorshipProjectWorkflowSummary"
    )
    expect(actionFacade).toContain("./server/workflow-agreement-actions")
    expect(actionFacade).toContain("connectFiscalSponsorshipDocumentAsset")
    expect(actionFacade).toContain("reviewFiscalSponsorshipDocument")
    expect(actionFacade).toContain("completeFiscalSponsorshipSignature")

    expect(nativeSigningMigration).toContain("fiscal-signing")
    expect(nativeSigningMigration).toContain(
      "create table if not exists public.fiscal_sponsorship_signing_drafts"
    )
    expect(nativeSigningMigration).toContain(
      "create table if not exists public.fiscal_sponsorship_signatures"
    )
    expect(nativeSigningMigration).toContain("force row level security")
    expect(nativeSigningMigration).toContain(
      "reject_fiscal_signing_evidence_mutation"
    )

    expect(docusealWebhook).toContain("DOCUSEAL_WEBHOOK_SECRET")
    expect(docusealWebhook).toContain("createHmac")
    expect(docusealWebhook).toContain("timingSafeEqual")
    expect(docusealWebhook).toContain("fiscal_sponsorship_events")
    expect(docusealWebhook).toContain("notifyFiscalDocuSealCompleted")
    expect(docusealWebhook).toContain(
      "persistFiscalSponsorshipExecutedDocuments"
    )

    expect(workflowNotifications).toContain("createNotification")
    expect(workflowNotifications).toContain("createSupabaseAdminClient")
    expect(workflowNotifications).toContain("loadPlatformAdminRecipientIds")
    expect(workflowNotifications).toContain(
      "loadOrganizationEditorRecipientIds"
    )
    expect(workflowNotifications).toContain(
      "fiscal_sponsorship_application_submitted"
    )
    expect(workflowNotifications).toContain(
      "fiscal_sponsorship_document_connected"
    )
    expect(workflowNotifications).toContain(
      "fiscal_sponsorship_agreement_completed"
    )

    expect(workflowEventSummary).toContain("fiscal_sponsorship_events")
    expect(workflowSummary).toContain("events: (events ?? [])")
    expect(workflowEventSummary).toContain("loadFiscalWorkflowEvents")
    expect(workflowEventSummary).toContain("mapFiscalWorkflowEventSummary")

    expect(projectAssetsRouteSupport).toContain("ALLOWED_FILE_EXTENSIONS")
    expect(projectAssetsRouteSupport).toContain("ALLOWED_MIME_TYPES")
    expect(projectAssetsRouteSupport).toContain("getProjectAssetFileError")
    expect(projectAssetsRouteSupport).toContain("getProjectAssetLinkError")
    expect(projectAssetsRouteSupport).toContain('parsed.protocol === "https:"')
    expect(projectAssetsRouteSupport).toContain('parsed.protocol === "http:"')
    expect(projectAssetsRouteSupport).toContain("application/pdf")
    expect(projectAssetsRouteSupport).toContain("text/csv")
    expect(projectAssetsRoute).toContain("getProjectAssetFileError")
    expect(projectAssetsRoute).toContain("getProjectAssetLinkError")
  })
})
