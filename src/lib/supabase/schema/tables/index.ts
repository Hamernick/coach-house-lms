import type { OrganizationsTable } from "./organizations"
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
import type { AcceleratorPurchasesTable } from "./accelerator_purchases"
import type { ElectivePurchasesTable } from "./elective_purchases"
import type { OrganizationMembershipsTable } from "./organization_memberships"
import type { OrganizationInvitesTable } from "./organization_invites"
import type { OrganizationAccessSettingsTable } from "./organization_access_settings"
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
import type { NotificationsTable } from "./notifications"

export type { OrganizationsTable } from "./organizations"
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
export type { AcceleratorPurchasesTable } from "./accelerator_purchases"
export type { ElectivePurchasesTable } from "./elective_purchases"
export type { OrganizationMembershipsTable } from "./organization_memberships"
export type { OrganizationInvitesTable } from "./organization_invites"
export type { OrganizationAccessSettingsTable } from "./organization_access_settings"
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
export type { NotificationsTable } from "./notifications"

export type PublicTables = {
  organizations: OrganizationsTable
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
  accelerator_purchases: AcceleratorPurchasesTable
  elective_purchases: ElectivePurchasesTable
  organization_memberships: OrganizationMembershipsTable
  organization_invites: OrganizationInvitesTable
  organization_access_settings: OrganizationAccessSettingsTable
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
  notifications: NotificationsTable
}
