export function resolveOrganizationInviteEmailDeliveryDescription({
  emailError,
  kind,
}: {
  emailError: string | null
  kind: "external_invite" | "existing_user_request"
}) {
  const normalized = emailError?.trim().toLowerCase() ?? ""

  if (normalized.includes("resend_api_key is not configured")) {
    return kind === "existing_user_request"
      ? "The access request is pending in Team Access, but email notifications are unavailable right now."
      : "Email delivery is unavailable right now. Share the copied invite link instead."
  }

  if (kind === "existing_user_request") {
    return (
      emailError ??
      "The request is pending in Team Access, but the email notification failed."
    )
  }

  return emailError ?? "Email delivery failed. Share the invite link instead."
}
