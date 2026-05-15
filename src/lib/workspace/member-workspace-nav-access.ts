export function resolveMemberWorkspaceNavAccess({
  isAdmin,
  showMemberWorkspace,
  hasActiveSubscription,
}: {
  isAdmin: boolean
  showMemberWorkspace?: boolean
  hasActiveSubscription?: boolean
}) {
  return Boolean(isAdmin || (showMemberWorkspace ?? hasActiveSubscription))
}

export function shouldForceStripeEntitlementSyncForWorkspace({
  isAdmin,
}: {
  isAdmin: boolean
}) {
  return !isAdmin
}
