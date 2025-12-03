export type PublicEnums = {
  user_role: "student" | "admin"
  module_progress_status: "not_started" | "in_progress" | "completed"
  subscription_status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
  organization_status: "pending" | "approved" | "n/a"
  submission_status: "submitted" | "accepted" | "revise"
  attachment_scope_type: "class" | "module" | "submission"
  attachment_kind: "deck" | "resource" | "submission"
}

