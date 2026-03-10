import Stripe from "stripe"
import type { Database } from "@/lib/supabase"

export type WebhookEventPayload = {
  stripe_event: unknown
  processed: boolean
  received_at: string
  processed_at?: string
  failed_at?: string
  error?: string
}

export function toWebhookPayload(
  event: Stripe.Event,
  patch: Partial<WebhookEventPayload>,
): WebhookEventPayload {
  return {
    stripe_event: event,
    processed: false,
    received_at: new Date().toISOString(),
    ...patch,
  }
}

export function extractUserIdFromMetadata(metadata: Stripe.Metadata) {
  const candidate = metadata.user_id ?? metadata.userId
  if (candidate && typeof candidate === "string") {
    return candidate
  }
  return undefined
}

export function extractOrganizationUserIdFromMetadata(metadata: Stripe.Metadata) {
  const candidate = metadata.org_user_id
  if (candidate && typeof candidate === "string") {
    return candidate
  }
  return undefined
}

export function toStatus(
  value: string,
): Database["public"]["Enums"]["subscription_status"] {
  const allowed: Database["public"]["Enums"]["subscription_status"][] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
  ]
  if (allowed.includes(value as Database["public"]["Enums"]["subscription_status"])) {
    return value as Database["public"]["Enums"]["subscription_status"]
  }
  return "trialing"
}

export function getCurrentPeriodEndIso(subscription: Stripe.Subscription) {
  const periodUnix = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end ?? null
  return periodUnix ? new Date(periodUnix * 1000).toISOString() : null
}
