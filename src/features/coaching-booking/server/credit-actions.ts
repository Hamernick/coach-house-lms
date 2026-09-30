"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type {
  CreditActionResult,
  IssueCoachingCreditsInput,
} from "../credit-types"
import { loadCoachingCreditPanelData } from "./credit-panel-data"
import { resolveCoachingCreditStaffContext } from "./credit-staff-context"
import { flushCoachingCalendarChange } from "./calendar-reconciliation"

const issueSchema = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  requestId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10000),
  source: z.enum(["accelerator", "alumni", "courtesy", "purchased"]),
  label: z.string().trim().min(1).max(160),
  reason: z.string().trim().min(1).max(1000),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
})

export async function loadCoachingCreditsAction(input: {
  orgId: string
  userId?: string
  before?: string
}): Promise<CreditActionResult> {
  try {
    return { ok: true, data: await loadCoachingCreditPanelData(input) }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load credits.",
    }
  }
}

export async function issueCoachingCreditsAction(
  input: IssueCoachingCreditsInput
): Promise<CreditActionResult> {
  try {
    const parsed = issueSchema.safeParse(input)
    if (!parsed.success)
      return {
        ok: false,
        error:
          "Choose a person, positive whole quantity, source, reason and valid expiration.",
      }
    const value = parsed.data
    const { admin, actorId, people } = await resolveCoachingCreditStaffContext(
      value.orgId
    )
    if (!people.some((person) => person.id === value.userId))
      throw new Error("Choose a member of this organization.")
    const { error } = await admin.rpc("issue_coaching_credits", {
      p_user_id: value.userId,
      p_org_id: value.orgId,
      p_quantity: value.quantity,
      p_source_type: value.source,
      p_label: value.label,
      p_reason: value.reason,
      p_expires_at: value.expiresAt,
      p_actor_id: actorId,
      p_request_key: `staff:${actorId}:${value.requestId}`,
    })
    if (error) throw new Error(error.message)
    revalidatePath("/organizations/[id]", "page")
    revalidatePath("/coaching")
    return {
      ok: true,
      data: await loadCoachingCreditPanelData({
        orgId: value.orgId,
        userId: value.userId,
      }),
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to issue credits.",
    }
  }
}

export async function manageStaffCoachingBookingAction(input: {
  orgId: string
  bookingId: string
  action: "cancel" | "completed" | "no_show"
  reason: string
}): Promise<CreditActionResult> {
  try {
    if (!["cancel", "completed", "no_show"].includes(input.action))
      throw new Error("Choose a valid meeting action.")
    const { admin, actorId } = await resolveCoachingCreditStaffContext(
      input.orgId
    )
    const { data: booking, error } = await admin
      .from("coaching_bookings")
      .select("id, user_id, org_id")
      .eq("id", input.bookingId)
      .eq("org_id", input.orgId)
      .maybeSingle()
    if (error || !booking) throw new Error("Meeting not found.")
    const result = await admin.rpc("manage_coaching_credit_booking", {
      p_booking_id: booking.id,
      p_actor_id: actorId,
      p_action: input.action,
      p_staff: true,
      p_reason: input.reason,
    })
    if (result.error) throw new Error(result.error.message)
    // A durable pending action remains when Calendar is unavailable; the worker retries it.
    await flushCoachingCalendarChange(booking.id).catch(() => undefined)
    revalidatePath("/coaching")
    revalidatePath("/organizations/[id]", "page")
    return {
      ok: true,
      data: await loadCoachingCreditPanelData({
        orgId: input.orgId,
        userId: booking.user_id,
      }),
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to update meeting.",
    }
  }
}
