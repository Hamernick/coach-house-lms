import type { OrganizationsTable } from "./organizations"
import type { AppPricingFeedbackResponsesTable } from "./app_pricing_feedback_responses"
import type { ModuleAssignmentsTable } from "./module_assignments"
import type { AssignmentSubmissionsTable } from "./assignment_submissions"
import type { AttachmentsTable } from "./attachments"
import type { EnrollmentInvitesTable } from "./enrollment_invites"
import type { ProfilesTable } from "./profiles"
import type { ClassesTable } from "./classes"
import type { ModulesTable } from "./modules"
import type { EnrollmentsTable } from "./enrollments"
import type { ModuleProgressTable } from "./module_progress"
import type { SubscriptionsTable } from "./subscriptions"
import type { StripeWebhookEventsTable } from "./stripe_webhook_events"
import type { ModuleContentTable } from "./module_content"
import type { OnboardingResponsesTable } from "./onboarding_responses"
import type { RoadmapEventsTable } from "./roadmap_events"
import type { RoadmapCalendarPublicEventsTable } from "./roadmap_calendar_public_events"
import type { RoadmapCalendarInternalEventsTable } from "./roadmap_calendar_internal_events"
import type { RoadmapCalendarPublicFeedsTable } from "./roadmap_calendar_public_feeds"
import type { RoadmapCalendarInternalFeedsTable } from "./roadmap_calendar_internal_feeds"
import type { SearchEventsTable } from "./search_events"
import type { ProgramsTable } from "./programs"
import type { ResourceMapSourcesTable } from "./resource_map_sources"
import type { ResourceMapImportBatchesTable } from "./resource_map_import_batches"
import type { ResourceMapIngestionRunsTable } from "./resource_map_ingestion_runs"
import type { ResourceMapRawIngestionRecordsTable } from "./resource_map_raw_ingestion_records"
import type { ResourceMapImportRecordsTable } from "./resource_map_import_records"
import type { ResourceMapCategoriesTable } from "./resource_map_categories"
import type { ResourceMapOrganizationsTable } from "./resource_map_organizations"
import type { ResourceMapServicesTable } from "./resource_map_services"
import type { ResourceMapServiceCategoriesTable } from "./resource_map_service_categories"
import type { ResourceMapLocationsTable } from "./resource_map_locations"
import type { ResourceMapContactsTable } from "./resource_map_contacts"
import type { ResourceMapLinksTable } from "./resource_map_links"
import type { ResourceMapImportRecordMatchesTable } from "./resource_map_import_record_matches"
import type { ResourceMapFieldEvidenceTable } from "./resource_map_field_evidence"
import type { ResourceMapCurationEventsTable } from "./resource_map_curation_events"
import type { PublicMapOrganizationCurationEventsTable } from "./public_map_organization_curation_events"
import type { AcceleratorPurchasesTable } from "./accelerator_purchases"
import type { ElectivePurchasesTable } from "./elective_purchases"
import type { OrganizationMembershipsTable } from "./organization_memberships"
import type { OrganizationInvitesTable } from "./organization_invites"
import type { OrganizationAccessRequestsTable } from "./organization_access_requests"
import type { OrganizationAccessSettingsTable } from "./organization_access_settings"
import type { OrganizationProjectAssetsTable } from "./organization_project_assets"
import type { OrganizationProjectNotesTable } from "./organization_project_notes"
import type { OrganizationProjectOverviewDocumentsTable } from "./organization_project_overview_documents"
import type { OrganizationProjectsTable } from "./organization_projects"
import type { OrganizationProjectQuickLinksTable } from "./organization_project_quick_links"
import type { OrganizationProjectActivityEventsTable } from "./organization_project_activity_events"
import type { OrganizationTaskAssigneesTable } from "./organization_task_assignees"
import type { OrganizationTasksTable } from "./organization_tasks"
import type { PlatformAdminProjectWorkstreamStatesTable } from "./platform_admin_project_workstream_states"
import type { PlatformAdminWorkstreamCategoriesTable } from "./platform_admin_workstream_categories"
import type { PlatformStaffMembersTable } from "./platform_staff_members"
import type { OrganizationCoachAssignmentsTable } from "./organization_coach_assignments"
import type { OrganizationWorkspaceBoardsTable } from "./organization_workspace_boards"
import type { OrganizationWorkspaceCommunicationChannelsTable } from "./organization_workspace_communication_channels"
import type { OrganizationWorkspaceCommunicationDeliveriesTable } from "./organization_workspace_communication_deliveries"
import type { OrganizationWorkspaceCommunicationsTable } from "./organization_workspace_communications"
import type { OrganizationWorkspaceInvitesTable } from "./organization_workspace_invites"
import type { OrganizationWorkspaceObjectiveActivityTable } from "./organization_workspace_objective_activity"
import type { OrganizationWorkspaceObjectiveAssigneesTable } from "./organization_workspace_objective_assignees"
import type { OrganizationWorkspaceObjectiveGroupsTable } from "./organization_workspace_objective_groups"
import type { OrganizationWorkspaceObjectiveLinksTable } from "./organization_workspace_objective_links"
import type { OrganizationWorkspaceObjectiveStepsTable } from "./organization_workspace_objective_steps"
import type { OrganizationWorkspaceObjectivesTable } from "./organization_workspace_objectives"
import type { OrganizationWorkspaceStarterStateTable } from "./organization_workspace_starter_state"
import type { NotificationsTable } from "./notifications"
import type { AppPageHealthEventsTable } from "./app_page_health_events"
import type { UserJourneyEventsTable } from "./user_journey_events"
import type { UserActivationCheckpointsTable } from "./user_activation_checkpoints"
import type { CoachingCoachesTable } from "./coaching_coaches"
import type { CoachingBookingsTable } from "./coaching_bookings"
import type { CoachingCreditLedgerTable } from "./coaching_credit_ledger"
import type { FiscalSponsorshipApplicationsTable } from "./fiscal_sponsorship_applications"
import type { FiscalSponsorshipDocumentsTable } from "./fiscal_sponsorship_documents"
import type { FiscalSponsorshipEventsTable } from "./fiscal_sponsorship_events"
import type { FiscalSponsorshipReviewsTable } from "./fiscal_sponsorship_reviews"
import type { FiscalSponsorshipSignaturePacketsTable } from "./fiscal_sponsorship_signature_packets"
import type { FiscalSponsorshipSigningDraftsTable } from "./fiscal_sponsorship_signing_drafts"
import type { FiscalSponsorshipSignaturesTable } from "./fiscal_sponsorship_signatures"
import type { PlatformEmailCampaignsTable } from "./platform_email_campaigns"
import type { PlatformEmailDeliveriesTable } from "./platform_email_deliveries"
import type { PlatformEmailEventsTable } from "./platform_email_events"
import type { PlatformEmailSuppressionsTable } from "./platform_email_suppressions"
import type { PlatformEmailTopicsTable } from "./platform_email_topics"
import type { PlatformEmailPreferencesTable } from "./platform_email_preferences"
import type { PlatformEmailConsentEventsTable } from "./platform_email_consent_events"
import type { PlatformEmailLinksTable } from "./platform_email_links"
import type { PlatformEmailLinkClicksTable } from "./platform_email_link_clicks"

export type { OrganizationsTable } from "./organizations"
export type { AppPricingFeedbackResponsesTable } from "./app_pricing_feedback_responses"
export type { ModuleAssignmentsTable } from "./module_assignments"
export type { AssignmentSubmissionsTable } from "./assignment_submissions"
export type { AttachmentsTable } from "./attachments"
export type { EnrollmentInvitesTable } from "./enrollment_invites"
export type { ProfilesTable } from "./profiles"
export type { ClassesTable } from "./classes"
export type { ModulesTable } from "./modules"
export type { EnrollmentsTable } from "./enrollments"
export type { ModuleProgressTable } from "./module_progress"
export type { SubscriptionsTable } from "./subscriptions"
export type { StripeWebhookEventsTable } from "./stripe_webhook_events"
export type { ModuleContentTable } from "./module_content"
export type { OnboardingResponsesTable } from "./onboarding_responses"
export type { RoadmapEventsTable } from "./roadmap_events"
export type { RoadmapCalendarPublicEventsTable } from "./roadmap_calendar_public_events"
export type { RoadmapCalendarInternalEventsTable } from "./roadmap_calendar_internal_events"
export type { RoadmapCalendarPublicFeedsTable } from "./roadmap_calendar_public_feeds"
export type { RoadmapCalendarInternalFeedsTable } from "./roadmap_calendar_internal_feeds"
export type { SearchEventsTable } from "./search_events"
export type { ProgramsTable } from "./programs"
export type { ResourceMapSourcesTable } from "./resource_map_sources"
export type { ResourceMapImportBatchesTable } from "./resource_map_import_batches"
export type { ResourceMapIngestionRunsTable } from "./resource_map_ingestion_runs"
export type { ResourceMapRawIngestionRecordsTable } from "./resource_map_raw_ingestion_records"
export type { ResourceMapImportRecordsTable } from "./resource_map_import_records"
export type { ResourceMapCategoriesTable } from "./resource_map_categories"
export type { ResourceMapOrganizationsTable } from "./resource_map_organizations"
export type { ResourceMapServicesTable } from "./resource_map_services"
export type { ResourceMapServiceCategoriesTable } from "./resource_map_service_categories"
export type { ResourceMapLocationsTable } from "./resource_map_locations"
export type { ResourceMapContactsTable } from "./resource_map_contacts"
export type { ResourceMapLinksTable } from "./resource_map_links"
export type { ResourceMapImportRecordMatchesTable } from "./resource_map_import_record_matches"
export type { ResourceMapFieldEvidenceTable } from "./resource_map_field_evidence"
export type { ResourceMapCurationEventsTable } from "./resource_map_curation_events"
export type { PublicMapOrganizationCurationEventsTable } from "./public_map_organization_curation_events"
export type { AcceleratorPurchasesTable } from "./accelerator_purchases"
export type { ElectivePurchasesTable } from "./elective_purchases"
export type { OrganizationMembershipsTable } from "./organization_memberships"
export type { OrganizationInvitesTable } from "./organization_invites"
export type { OrganizationAccessRequestsTable } from "./organization_access_requests"
export type { OrganizationAccessSettingsTable } from "./organization_access_settings"
export type { OrganizationProjectAssetsTable } from "./organization_project_assets"
export type { OrganizationProjectNotesTable } from "./organization_project_notes"
export type { OrganizationProjectOverviewDocumentsTable } from "./organization_project_overview_documents"
export type { OrganizationProjectsTable } from "./organization_projects"
export type { OrganizationProjectQuickLinksTable } from "./organization_project_quick_links"
export type { OrganizationProjectActivityEventsTable } from "./organization_project_activity_events"
export type { OrganizationTaskAssigneesTable } from "./organization_task_assignees"
export type { OrganizationTasksTable } from "./organization_tasks"
export type { PlatformAdminProjectWorkstreamStatesTable } from "./platform_admin_project_workstream_states"
export type { PlatformAdminWorkstreamCategoriesTable } from "./platform_admin_workstream_categories"
export type { PlatformStaffMembersTable } from "./platform_staff_members"
export type { OrganizationCoachAssignmentsTable } from "./organization_coach_assignments"
export type { OrganizationWorkspaceBoardsTable } from "./organization_workspace_boards"
export type { OrganizationWorkspaceCommunicationChannelsTable } from "./organization_workspace_communication_channels"
export type { OrganizationWorkspaceCommunicationDeliveriesTable } from "./organization_workspace_communication_deliveries"
export type { OrganizationWorkspaceCommunicationsTable } from "./organization_workspace_communications"
export type { OrganizationWorkspaceInvitesTable } from "./organization_workspace_invites"
export type { OrganizationWorkspaceObjectiveActivityTable } from "./organization_workspace_objective_activity"
export type { OrganizationWorkspaceObjectiveAssigneesTable } from "./organization_workspace_objective_assignees"
export type { OrganizationWorkspaceObjectiveGroupsTable } from "./organization_workspace_objective_groups"
export type { OrganizationWorkspaceObjectiveLinksTable } from "./organization_workspace_objective_links"
export type { OrganizationWorkspaceObjectiveStepsTable } from "./organization_workspace_objective_steps"
export type { OrganizationWorkspaceObjectivesTable } from "./organization_workspace_objectives"
export type { OrganizationWorkspaceStarterStateTable } from "./organization_workspace_starter_state"
export type { NotificationsTable } from "./notifications"
export type { AppPageHealthEventsTable } from "./app_page_health_events"
export type { UserJourneyEventsTable } from "./user_journey_events"
export type { UserActivationCheckpointsTable } from "./user_activation_checkpoints"
export type { CoachingCoachesTable } from "./coaching_coaches"
export type { CoachingBookingsTable } from "./coaching_bookings"
export type { CoachingCreditLedgerTable } from "./coaching_credit_ledger"
export type { FiscalSponsorshipApplicationsTable } from "./fiscal_sponsorship_applications"
export type { FiscalSponsorshipDocumentsTable } from "./fiscal_sponsorship_documents"
export type { FiscalSponsorshipEventsTable } from "./fiscal_sponsorship_events"
export type { FiscalSponsorshipReviewsTable } from "./fiscal_sponsorship_reviews"
export type { FiscalSponsorshipSignaturePacketsTable } from "./fiscal_sponsorship_signature_packets"
export type { FiscalSponsorshipSigningDraftsTable } from "./fiscal_sponsorship_signing_drafts"
export type { FiscalSponsorshipSignaturesTable } from "./fiscal_sponsorship_signatures"
export type { PlatformEmailCampaignsTable } from "./platform_email_campaigns"
export type { PlatformEmailDeliveriesTable } from "./platform_email_deliveries"
export type { PlatformEmailEventsTable } from "./platform_email_events"
export type { PlatformEmailSuppressionsTable } from "./platform_email_suppressions"
export type { PlatformEmailTopicsTable } from "./platform_email_topics"
export type { PlatformEmailPreferencesTable } from "./platform_email_preferences"
export type { PlatformEmailConsentEventsTable } from "./platform_email_consent_events"
export type { PlatformEmailLinksTable } from "./platform_email_links"
export type { PlatformEmailLinkClicksTable } from "./platform_email_link_clicks"

export type PublicTables = {
  organizations: OrganizationsTable
  app_pricing_feedback_responses: AppPricingFeedbackResponsesTable
  module_assignments: ModuleAssignmentsTable
  assignment_submissions: AssignmentSubmissionsTable
  attachments: AttachmentsTable
  enrollment_invites: EnrollmentInvitesTable
  profiles: ProfilesTable
  classes: ClassesTable
  modules: ModulesTable
  enrollments: EnrollmentsTable
  module_progress: ModuleProgressTable
  subscriptions: SubscriptionsTable
  stripe_webhook_events: StripeWebhookEventsTable
  module_content: ModuleContentTable
  onboarding_responses: OnboardingResponsesTable
  roadmap_events: RoadmapEventsTable
  roadmap_calendar_public_events: RoadmapCalendarPublicEventsTable
  roadmap_calendar_internal_events: RoadmapCalendarInternalEventsTable
  roadmap_calendar_public_feeds: RoadmapCalendarPublicFeedsTable
  roadmap_calendar_internal_feeds: RoadmapCalendarInternalFeedsTable
  search_events: SearchEventsTable
  programs: ProgramsTable
  resource_map_sources: ResourceMapSourcesTable
  resource_map_import_batches: ResourceMapImportBatchesTable
  resource_map_ingestion_runs: ResourceMapIngestionRunsTable
  resource_map_raw_ingestion_records: ResourceMapRawIngestionRecordsTable
  resource_map_import_records: ResourceMapImportRecordsTable
  resource_map_categories: ResourceMapCategoriesTable
  resource_map_organizations: ResourceMapOrganizationsTable
  resource_map_services: ResourceMapServicesTable
  resource_map_service_categories: ResourceMapServiceCategoriesTable
  resource_map_locations: ResourceMapLocationsTable
  resource_map_contacts: ResourceMapContactsTable
  resource_map_links: ResourceMapLinksTable
  resource_map_import_record_matches: ResourceMapImportRecordMatchesTable
  resource_map_field_evidence: ResourceMapFieldEvidenceTable
  resource_map_curation_events: ResourceMapCurationEventsTable
  public_map_organization_curation_events: PublicMapOrganizationCurationEventsTable
  accelerator_purchases: AcceleratorPurchasesTable
  elective_purchases: ElectivePurchasesTable
  organization_memberships: OrganizationMembershipsTable
  organization_invites: OrganizationInvitesTable
  organization_access_requests: OrganizationAccessRequestsTable
  organization_access_settings: OrganizationAccessSettingsTable
  organization_project_assets: OrganizationProjectAssetsTable
  organization_project_notes: OrganizationProjectNotesTable
  organization_project_overview_documents: OrganizationProjectOverviewDocumentsTable
  organization_projects: OrganizationProjectsTable
  organization_project_quick_links: OrganizationProjectQuickLinksTable
  organization_project_activity_events: OrganizationProjectActivityEventsTable
  organization_task_assignees: OrganizationTaskAssigneesTable
  organization_tasks: OrganizationTasksTable
  platform_admin_project_workstream_states: PlatformAdminProjectWorkstreamStatesTable
  platform_admin_workstream_categories: PlatformAdminWorkstreamCategoriesTable
  platform_staff_members: PlatformStaffMembersTable
  organization_coach_assignments: OrganizationCoachAssignmentsTable
  organization_workspace_boards: OrganizationWorkspaceBoardsTable
  organization_workspace_communication_channels: OrganizationWorkspaceCommunicationChannelsTable
  organization_workspace_communication_deliveries: OrganizationWorkspaceCommunicationDeliveriesTable
  organization_workspace_communications: OrganizationWorkspaceCommunicationsTable
  organization_workspace_invites: OrganizationWorkspaceInvitesTable
  organization_workspace_objective_activity: OrganizationWorkspaceObjectiveActivityTable
  organization_workspace_objective_assignees: OrganizationWorkspaceObjectiveAssigneesTable
  organization_workspace_objective_groups: OrganizationWorkspaceObjectiveGroupsTable
  organization_workspace_objective_links: OrganizationWorkspaceObjectiveLinksTable
  organization_workspace_objective_steps: OrganizationWorkspaceObjectiveStepsTable
  organization_workspace_objectives: OrganizationWorkspaceObjectivesTable
  organization_workspace_starter_state: OrganizationWorkspaceStarterStateTable
  notifications: NotificationsTable
  app_page_health_events: AppPageHealthEventsTable
  user_journey_events: UserJourneyEventsTable
  user_activation_checkpoints: UserActivationCheckpointsTable
  coaching_coaches: CoachingCoachesTable
  coaching_bookings: CoachingBookingsTable
  coaching_credit_ledger: CoachingCreditLedgerTable
  fiscal_sponsorship_applications: FiscalSponsorshipApplicationsTable
  fiscal_sponsorship_documents: FiscalSponsorshipDocumentsTable
  fiscal_sponsorship_events: FiscalSponsorshipEventsTable
  fiscal_sponsorship_reviews: FiscalSponsorshipReviewsTable
  fiscal_sponsorship_signature_packets: FiscalSponsorshipSignaturePacketsTable
  fiscal_sponsorship_signing_drafts: FiscalSponsorshipSigningDraftsTable
  fiscal_sponsorship_signatures: FiscalSponsorshipSignaturesTable
  platform_email_campaigns: PlatformEmailCampaignsTable
  platform_email_deliveries: PlatformEmailDeliveriesTable
  platform_email_events: PlatformEmailEventsTable
  platform_email_suppressions: PlatformEmailSuppressionsTable
  platform_email_topics: PlatformEmailTopicsTable
  platform_email_preferences: PlatformEmailPreferencesTable
  platform_email_consent_events: PlatformEmailConsentEventsTable
  platform_email_links: PlatformEmailLinksTable
  platform_email_link_clicks: PlatformEmailLinkClicksTable
}
