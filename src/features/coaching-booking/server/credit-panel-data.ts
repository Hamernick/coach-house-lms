import "server-only"

import type { CoachingCreditPanelData } from "../credit-types"
import { loadPersonalCoachingCreditAccount } from "./credit-account"
import { resolveCoachingCreditStaffContext } from "./credit-staff-context"

export async function loadCoachingCreditPanelData({
  orgId,
  userId,
  before,
}: {
  orgId: string
  userId?: string
  before?: string
}): Promise<CoachingCreditPanelData> {
  const { admin, people } = await resolveCoachingCreditStaffContext(orgId)
  const selectedUserId = userId ?? people[0]?.id ?? null
  if (!selectedUserId)
    return {
      orgId,
      people,
      selectedUserId,
      account: null,
      history: [],
      hasMore: false,
      bookings: [],
    }
  if (!people.some((person) => person.id === selectedUserId))
    throw new Error("Choose a member of this organization.")
  let historyQuery = admin
    .from("coaching_credit_ledger")
    .select(
      "id, quantity, source, note, created_at, booking_id, actor_id, grant_id"
    )
    .eq("user_id", selectedUserId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(51)
  if (before) {
    const [date, id] = before.split("|")
    if (
      !Number.isFinite(Date.parse(date)) ||
      !/^[0-9a-f-]{36}$/i.test(id ?? "")
    )
      throw new Error("Invalid history cursor.")
    historyQuery = historyQuery.or(
      `created_at.lt.${date},and(created_at.eq.${date},id.lt.${id})`
    )
  }
  const [account, history, bookings] = await Promise.all([
    loadPersonalCoachingCreditAccount(selectedUserId),
    historyQuery,
    admin
      .from("coaching_bookings")
      .select("id, user_id, starts_at, status, calendar_pending_action")
      .eq("user_id", selectedUserId)
      .eq("org_id", orgId)
      .eq("status", "confirmed")
      .order("starts_at", { ascending: false })
      .limit(20),
  ])
  if (history.error || bookings.error)
    throw new Error("Unable to load coaching history.")
  const actorIds = Array.from(
    new Set(
      (history.data ?? [])
        .map((entry) => entry.actor_id)
        .filter((id): id is string => !!id)
    )
  )
  const actors = actorIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", actorIds)
    : null
  if (actors?.error)
    throw new Error("Unable to load credit history staff names.")
  const names = new Map(
    (actors?.data ?? []).map((row) => [row.id, row.full_name || row.email])
  )
  const entries = (history.data ?? []).slice(0, 50).map((entry) => ({
    ...entry,
    actorName: entry.actor_id
      ? (names.get(entry.actor_id) ?? "Staff")
      : "System",
  }))
  return {
    orgId,
    people,
    selectedUserId,
    account,
    history: entries,
    hasMore: (history.data?.length ?? 0) > 50,
    bookings: bookings.data ?? [],
  }
}

export async function loadAdminCoachingCredits(
  orgId: string
): Promise<CoachingCreditPanelData> {
  try {
    return await loadCoachingCreditPanelData({ orgId })
  } catch {
    return {
      orgId,
      people: [],
      selectedUserId: null,
      account: null,
      history: [],
      hasMore: false,
      bookings: [],
      error:
        "Coaching credits are temporarily unavailable. Refresh to try again.",
    }
  }
}
