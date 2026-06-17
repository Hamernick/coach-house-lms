export type AccountDeletionAccountType =
  | "admin"
  | "paid_owner"
  | "org_owner"
  | "member"
  | "free"

export type AccountDeletionNotice = {
  id: string
  title: string
  description: string
}

export type AccountDeletionCleanupItem = {
  id: string
  label: string
  count: number
  disposition: "deleted" | "removed" | "retained" | "unchanged"
}

export type AccountDeletionPreflight = {
  canDelete: boolean
  accountType: AccountDeletionAccountType
  billing: {
    hasCancellationRisk: boolean
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    status: string | null
    planLabel: string | null
  }
  counts: {
    ownedOrganizations: number
    ownedOrganizationMembers: number
    joinedOrganizations: number
    sharedWorkspaceAuthorReferences: number
    pendingAccessRequests: number
    pendingInvitesSent: number
  }
  cleanupPreview: AccountDeletionCleanupItem[]
  warnings: AccountDeletionNotice[]
  blockingIssues: AccountDeletionNotice[]
}
