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
import type { SearchEventsTable } from "./search_events"
import type { AcceleratorPurchasesTable } from "./accelerator_purchases"
import type { OrganizationMembershipsTable } from "./organization_memberships"
import type { OrganizationInvitesTable } from "./organization_invites"
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
export type { SearchEventsTable } from "./search_events"
export type { AcceleratorPurchasesTable } from "./accelerator_purchases"
export type { OrganizationMembershipsTable } from "./organization_memberships"
export type { OrganizationInvitesTable } from "./organization_invites"
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
  search_events: SearchEventsTable
  accelerator_purchases: AcceleratorPurchasesTable
  organization_memberships: OrganizationMembershipsTable
  organization_invites: OrganizationInvitesTable
  notifications: NotificationsTable
}
