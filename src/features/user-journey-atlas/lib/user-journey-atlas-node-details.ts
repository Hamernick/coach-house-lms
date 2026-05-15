import type { UserJourneyAtlasNode } from "../types"

export type UserJourneyNodeDetails = Pick<
  UserJourneyAtlasNode,
  "dataFields" | "systemEvents"
> &
  Partial<Pick<UserJourneyAtlasNode, "healthStatus" | "healthSummary">>

export const DEFAULT_NODE_DETAILS_BY_LANE: Record<
  string,
  UserJourneyNodeDetails
> = {
  public: {
    dataFields: ["CTA source", "selected journey", "selected pricing tier"],
    systemEvents: ["Builds safe hrefs for signup or same-page routing"],
  },
  auth: {
    dataFields: ["email", "password", "intent focus", "redirect target"],
    systemEvents: ["Creates Supabase auth user and confirmation redirect"],
  },
  emails: {
    dataFields: ["recipient email", "confirmation or invite URL", "email tags"],
    systemEvents: ["Sends the next-step link outside the app"],
  },
  billing: {
    dataFields: ["plan tier", "checkout source", "redirect/cancel path"],
    systemEvents: ["Creates or verifies Stripe subscription state"],
  },
  onboarding: {
    dataFields: ["intent", "organization", "profile", "plan"],
    systemEvents: ["Saves onboarding draft and completes workspace setup"],
  },
  workspace: {
    dataFields: ["active organization", "billing access", "workspace layout"],
    systemEvents: ["Composes the canvas and first-run workspace guide"],
  },
  intake: {
    dataFields: ["notes", "assignment answers", "workspace records"],
    systemEvents: ["Persists user-entered operational data"],
  },
  find: {
    dataFields: ["member intent", "search query", "saved organizations"],
    systemEvents: ["Routes free member journeys into the public map"],
  },
  upgrade: {
    dataFields: ["paywall source", "upgrade plan", "checkout redirect"],
    systemEvents: ["Hands authenticated upgrades into Stripe checkout"],
  },
  invites: {
    dataFields: ["recipient", "role", "duration", "invite token"],
    systemEvents: ["Creates access requests, links, and notification state"],
  },
  prototype: {
    dataFields: ["Mermaid source", "file path", "graph metadata"],
    systemEvents: ["Displays the admin-only atlas"],
    healthStatus: "admin-reference",
  },
  operations: {
    dataFields: ["event name", "external handoff", "completion signal"],
    systemEvents: ["Closes the loop between product usage and operational follow-up"],
    healthStatus: "integration-gap",
  },
}

export const USER_JOURNEY_NODE_DETAILS: Record<
  string,
  UserJourneyNodeDetails
> = {
  public_home: {
    dataFields: ["auth callback params", "selected public section", "signed-in state"],
    systemEvents: ["Mounts public home and resumes pending auth redirects"],
  },
  pricing_data: {
    dataFields: ["tier id", "CTA href", "feature copy"],
    systemEvents: ["Defines Individual, Organization, and Operations Support entry points"],
  },
  home_canvas: {
    dataFields: ["section slug", "URL search params", "panel state"],
    systemEvents: ["Keeps signup and pricing interactions on the public canvas"],
  },
  home_signup_panel: {
    dataFields: ["intent=build", "plan", "pricing source"],
    systemEvents: ["Locks paid CTAs to the builder account path"],
  },
  section_link_controller: {
    dataFields: ["target section", "selected plan", "same-page navigation event"],
    systemEvents: ["Turns CTA clicks into immediate canvas panel updates"],
  },
  sign_up_page: {
    dataFields: ["intent", "plan", "redirect", "signed-in session"],
    systemEvents: ["Normalizes plan and redirects already-authenticated users"],
  },
  sign_up_form: {
    dataFields: ["email", "password", "confirm password", "intent focus"],
    systemEvents: ["Sends account_intent, onboarding_intent_focus, and emailRedirectTo to Supabase"],
  },
  confirmation_email_template: {
    dataFields: ["recipient email", "ConfirmationURL", "SiteURL logo"],
    systemEvents: ["Delivers the account verification link"],
    healthStatus: "recovery-gap",
    healthSummary: "Needs visible resend, change-email, expired-link, and stalled-confirmation paths.",
  },
  auth_confirm: {
    dataFields: ["token_hash", "type", "next destination"],
    systemEvents: ["Verifies Supabase OTP and resolves safe redirect destination"],
    healthStatus: "recovery-gap",
    healthSummary: "The verification route exists, but the atlas should show invalid/expired link recovery.",
  },
  auth_confirmation_rules: {
    dataFields: ["OTP type", "destination origin", "callback redirect"],
    systemEvents: ["Blocks unsafe confirmation destinations"],
  },
  auth_callback: {
    dataFields: ["auth code", "redirect path", "session cookies"],
    systemEvents: ["Exchanges code for session and resumes the journey"],
  },
  signup_plan: {
    dataFields: ["raw plan", "intent", "normalized plan tier"],
    systemEvents: ["Splits free, Organization, and Operations Support paths"],
  },
  stripe_checkout: {
    dataFields: ["plan tier", "source", "context", "redirect/cancel"],
    systemEvents: ["Creates Stripe session with user, org, plan, and subscription metadata"],
    healthStatus: "recovery-gap",
    healthSummary: "Payment cancel, incomplete checkout, and login-return states need explicit recovery branches.",
  },
  pricing_success: {
    dataFields: ["session_id", "redirect", "context"],
    systemEvents: ["Verifies checkout and persists subscription state before redirect"],
    healthStatus: "recovery-gap",
    healthSummary: "Checkout success needs a visible delayed-webhook and subscription-sync fallback path.",
  },
  onboarding_return: {
    dataFields: ["checkout session", "selected plan", "safe return URL"],
    systemEvents: ["Appends paid checkout state to onboarding redirects"],
  },
  stripe_webhook: {
    dataFields: ["event_id", "customer", "subscription", "plan_tier"],
    systemEvents: ["Receives signed Stripe events and reconciles subscription lifecycle"],
  },
  onboarding_page: {
    dataFields: ["plan override", "default profile", "onboarding source"],
    systemEvents: ["Chooses paid plan override and renders post-signup setup"],
  },
  onboarding_flow: {
    dataFields: ["draft snapshot", "step progress", "visible steps"],
    systemEvents: ["Persists draft state across pricing redirects"],
  },
  onboarding_intent: {
    dataFields: ["build/find/fund/support focus"],
    systemEvents: ["Chooses builder or member onboarding branch"],
  },
  onboarding_pricing: {
    dataFields: ["current plan tier", "checkout return", "checkout errors"],
    systemEvents: ["Starts Organization or Operations Support checkout from onboarding"],
    healthStatus: "recovery-gap",
    healthSummary: "Needs a clear cancel/resume path when paid checkout interrupts onboarding.",
  },
  onboarding_org: {
    dataFields: ["organization name", "organization URL", "formation status"],
    systemEvents: ["Checks slug availability and prepares the workspace organization"],
  },
  onboarding_account: {
    dataFields: ["avatar", "first/last name", "phone", "public email", "title", "LinkedIn", "opt-ins"],
    systemEvents: ["Carries profile data into account and public workspace context"],
  },
  onboarding_card: {
    dataFields: ["inline onboarding form", "selected tier", "workspace setup mode"],
    systemEvents: ["Embeds the setup flow in the dashboard onboarding route"],
  },
  onboarding_actions: {
    dataFields: ["submitted FormData", "intent", "builder plan tier"],
    systemEvents: ["Clears onboarding lock and routes to workspace or find"],
  },
  workspace_route: {
    dataFields: ["auth session", "account intent", "workspace access"],
    systemEvents: ["Guards free finder accounts before composing workspace"],
  },
  workspace_content: {
    dataFields: ["seed data", "billing access", "admin context"],
    systemEvents: ["Loads the organization workspace model"],
  },
  workspace_canvas: {
    dataFields: ["workspace cards", "layout state", "connections"],
    systemEvents: ["Renders the canvas users land in after setup"],
  },
  workspace_tutorial: {
    dataFields: ["tutorial progress", "current scene", "continue state"],
    systemEvents: ["Guides first-run workspace activation"],
    healthStatus: "activation-gap",
    healthSummary: "The guide should write activation checkpoints and route users to a first real win.",
  },
  dynamic_form: {
    dataFields: ["schema fields", "initial values", "string/number/boolean/enum/array inputs"],
    systemEvents: ["Renders admin-configured structured forms"],
  },
  module_notes_ui: {
    dataFields: ["note content", "markdown format", "module id"],
    systemEvents: ["Saves learner notes into module_progress"],
  },
  module_notes_api: {
    dataFields: ["content", "format=markdown", "module id"],
    systemEvents: ["Upserts module notes for the signed-in user"],
    healthStatus: "activation-gap",
    healthSummary: "A saved note should trigger review, next-step guidance, or progress credit.",
  },
  assignment_form: {
    dataFields: ["short text", "long text", "selects", "multi-selects", "budget tables", "sliders", "custom program"],
    systemEvents: ["Collects homework answers from module assignment schema"],
  },
  assignment_submission: {
    dataFields: ["answers JSON", "submission status", "module id"],
    systemEvents: ["Sanitizes answers, stores submission, syncs mapped profile fields, and marks completion"],
    healthStatus: "activation-gap",
    healthSummary: "Submitted homework needs feedback, coach review, and a visible next milestone.",
  },
  homework_assist: {
    dataFields: ["field name", "field label", "prompt context", "current answer"],
    systemEvents: ["Generates a homework suggestion from module and org profile context"],
    healthStatus: "ai-stub",
    healthSummary: "The endpoint exists, but the generator is deterministic rather than model-backed.",
  },
  workspace_objective_editor: {
    dataFields: ["title", "description", "priority", "due date", "category", "assignees"],
    systemEvents: ["Updates workspace formation tracker objectives"],
    healthStatus: "activation-gap",
    healthSummary: "Created objectives should become measurable tasks with ownership and reminders.",
  },
  workspace_calendar_form: {
    dataFields: ["title", "details", "type", "start/end", "roles", "recurrence"],
    systemEvents: ["Creates or edits roadmap calendar events"],
    healthStatus: "integration-gap",
    healthSummary: "Internal events exist, but coach Google Calendar sync and booking confirmation are missing.",
  },
  workspace_comms_editor: {
    dataFields: ["channel", "connected provider", "copy", "media mode", "schedule"],
    systemEvents: ["Queues simulated workspace communications activity"],
    healthStatus: "integration-gap",
    healthSummary: "Scheduled communications are still simulated and need provider delivery states.",
  },
  org_profile_company: {
    dataFields: ["identity", "contact", "address", "story", "presence", "social links"],
    systemEvents: ["Updates the public organization profile surface"],
    healthStatus: "activation-gap",
    healthSummary: "Profile edits should close into completeness, publish, and Find visibility checkpoints.",
  },
  find_route: {
    dataFields: ["session", "member onboarding flag", "source"],
    systemEvents: ["Keeps public directory access safe for free and paid users"],
  },
  public_map: {
    dataFields: ["search query", "map/list state", "saved organizations"],
    systemEvents: ["Displays public organizations and member rails"],
  },
  member_onboarding: {
    dataFields: ["intent focus", "step index", "skip/start exploring"],
    systemEvents: ["Introduces map, search, saved orgs, notifications, and organization switching"],
    healthStatus: "activation-gap",
    healthSummary: "The free-member intro should record first saved org, contact, or follow-up intent.",
  },
  app_sidebar: {
    dataFields: ["account tier", "current route", "upgrade CTA source"],
    systemEvents: ["Shows shell-level upgrade entry points"],
  },
  paywall_config: {
    dataFields: ["plan", "source", "redirect", "cancel"],
    systemEvents: ["Builds checkout URLs for locked surfaces"],
  },
  paywall_overlay: {
    dataFields: ["selected plan", "paywall source", "upgrade intent"],
    systemEvents: ["Displays the upgrade decision before checkout"],
    healthStatus: "recovery-gap",
    healthSummary: "Upgrade dialogs need clear cancel, return, and already-paid fallback states.",
  },
  invite_sheet: {
    dataFields: ["invite type", "access level", "email/member", "duration"],
    systemEvents: ["Creates team and temporary collaboration invites"],
  },
  invite_actions: {
    dataFields: ["recipient email", "role", "organization", "request id"],
    systemEvents: ["Creates external invites or existing-user access requests"],
  },
  invite_email_delivery: {
    dataFields: ["to", "subject", "review/join URL", "expires at"],
    systemEvents: ["Sends app-owned Resend invite and access-request emails"],
  },
  resend_delivery: {
    dataFields: ["from", "to", "subject", "html/text", "tags", "unsubscribe headers"],
    systemEvents: ["Posts normalized email payloads to the Resend API"],
  },
  email_foundation: {
    dataFields: ["subject", "preview text", "CTA URL", "stats"],
    systemEvents: ["Renders Coach House email HTML previews"],
  },
  join_org: {
    dataFields: ["invite token", "login/signup state", "role"],
    systemEvents: ["Completes external invite review and membership acceptance"],
  },
  access_requests: {
    dataFields: ["request id", "accept/decline decision", "notification state"],
    systemEvents: ["Lets existing users respond to requested access"],
  },
  workspace_activation_outcomes: {
    dataFields: ["profile completed", "first homework submitted", "first invite or coaching action"],
    systemEvents: ["Should turn workspace activity into measurable activation checkpoints"],
    healthStatus: "activation-gap",
    healthSummary: "Add a durable activation model so product progress is not just isolated form saves.",
  },
  product_analytics: {
    dataFields: ["CTA clicked", "signup started", "checkout completed", "workspace first win"],
    systemEvents: ["Loads page analytics but needs product event capture"],
    healthStatus: "telemetry-gap",
    healthSummary: "Add event-level funnel telemetry beyond page views.",
  },
  otel_instrumentation: {
    dataFields: ["OTEL endpoint", "service name", "server traces"],
    systemEvents: ["Initializes server observability when an exporter is configured"],
    healthStatus: "telemetry-gap",
    healthSummary: "Server traces are optional and not tied to user journey milestones.",
  },
  coaching_schedule: {
    dataFields: ["active org", "coaching tier", "booking URL", "meeting request count"],
    systemEvents: ["Returns Google booking links and records that scheduling was opened"],
    healthStatus: "integration-gap",
    healthSummary: "Scheduling opens an external booking link but does not sync confirmed sessions yet.",
  },
  coaching_tier_rules: {
    dataFields: ["included sessions", "sessions used", "free/discounted/full tier"],
    systemEvents: ["Chooses the coaching booking tier for the account"],
    healthStatus: "integration-gap",
    healthSummary: "Eligibility is local, but confirmed appointments are not reconciled from calendars.",
  },
  notification_create: {
    dataFields: ["user id", "title", "description", "metadata"],
    systemEvents: ["Creates in-app notifications for follow-up loops"],
    healthStatus: "live",
  },
  homework_assist_library: {
    dataFields: ["field label", "prompt context", "current answer", "org profile"],
    systemEvents: ["Returns deterministic HTML guidance for homework fields"],
    healthStatus: "ai-stub",
    healthSummary: "Replace the deterministic helper with a model-backed assistant and review loop.",
  },
}
