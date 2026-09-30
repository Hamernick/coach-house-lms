export const COACHING_CREDIT_SOURCES = {
  accelerator: "Accelerator",
  alumni: "Alumni Services Contract",
  courtesy: "Courtesy / Bonus",
  purchased: "Purchased Coaching",
} as const
export type CoachingCreditSource = keyof typeof COACHING_CREDIT_SOURCES
export type CoachingCreditGrant = {
  id: string
  label: string
  sourceType: string
  issued: number
  available: number
  expiresAt: string | null
  createdAt: string
}
export type CoachingCreditAccount = {
  available: number
  includedAllowance: number
  consumed: number
  grants: CoachingCreditGrant[]
}
export type CoachingCreditHistoryEntry = {
  id: string
  quantity: number
  source: string
  note: string | null
  created_at: string
  actorName?: string | null
  booking_id: string | null
  actor_id: string | null
  grant_id: string | null
}
export type CoachingStaffBooking = {
  id: string
  user_id: string
  starts_at: string
  status: string
  calendar_pending_action: string | null
}
export type CoachingCreditPerson = {
  id: string
  name: string
  email: string | null
}
export type CoachingCreditPanelData = {
  orgId: string
  people: CoachingCreditPerson[]
  selectedUserId: string | null
  account: CoachingCreditAccount | null
  history: CoachingCreditHistoryEntry[]
  hasMore: boolean
  bookings: CoachingStaffBooking[]
  error?: string
}
export type IssueCoachingCreditsInput = {
  orgId: string
  userId: string
  quantity: number
  source: CoachingCreditSource
  label: string
  reason: string
  expiresAt: string | null
  requestId: string
}
export type CreditActionResult =
  | { ok: true; data: CoachingCreditPanelData }
  | { ok: false; error: string }
export type LoadCreditPanelAction = (input: {
  orgId: string
  userId?: string
  before?: string
}) => Promise<CreditActionResult>
export type IssueCreditsAction = (
  input: IssueCoachingCreditsInput
) => Promise<CreditActionResult>
export type ManageStaffCoachingAction = (input: {
  orgId: string
  bookingId: string
  action: "cancel" | "completed" | "no_show"
  reason: string
}) => Promise<CreditActionResult>
