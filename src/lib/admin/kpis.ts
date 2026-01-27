import { createSupabaseServerClient } from "@/lib/supabase/server"

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== "object") return String(error)
  const record = error as Record<string, unknown>
  const code = typeof record.code === "string" ? record.code : null
  const message = typeof record.message === "string" ? record.message : null
  const details = typeof record.details === "string" ? record.details : null
  return [code, message, details].filter(Boolean).join(" — ") || "Unknown error"
}

export type AdminKpis = {
  totalStudents: number
  activeSubscriptions: number
  thirtyDayRevenue: number
  revenueCurrency: string
}

export type AdminRecentEnrollment = {
  id: string
  userId: string
  userEmail: string
  classTitle: string
  enrolledAt: string
}

export type AdminRecentPayment = {
  id: string
  userId: string
  userEmail: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
}

type SubscriptionRow = {
  status: string | null
  metadata: unknown
  updated_at: string | null
  created_at?: string | null
}

type EnrollmentRow = {
  id: string
  user_id: string
  created_at: string
  classes?: { title: string | null } | null
}

type SubscriptionPaymentRow = {
  id: string
  user_id: string
  status: string | null
  metadata: unknown
  updated_at: string | null
}


function extractAmount(metadata: unknown): { amount: number; currency: string } | null {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const record = metadata as Record<string, unknown>
  const amount = typeof record.planAmount === "number" ? record.planAmount : null
  const currency = typeof record.planCurrency === "string" ? record.planCurrency : "usd"

  if (amount === null) {
    return null
  }

  return { amount, currency }
}

export async function fetchAdminKpis(): Promise<AdminKpis> {
  const supabase = await createSupabaseServerClient()

  const [{ data: profileCount, error: profileError }, { data: subs, error: subsError }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("status, metadata, updated_at")
      .order("updated_at", { ascending: false })
      .returns<SubscriptionRow[]>()
  ])

  if (profileError) {
    throw new Error(`Unable to load profiles count: ${formatSupabaseError(profileError)}`)
  }
  if (subsError) {
    throw new Error(`Unable to load subscriptions: ${formatSupabaseError(subsError)}`)
  }

  const profileSummary = profileCount as unknown as { count: number | null } | null
  const subscriptionRows = subs ?? []
  const activeSubscriptions = subscriptionRows.filter((row) => row.status === "active").length

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  let revenueTotal = 0
  let revenueCurrency = "usd"

  for (const row of subscriptionRows) {
    if (new Date(row.updated_at ?? row.created_at ?? "1970-01-01").getTime() < thirtyDaysAgo) {
      continue
    }
    const amountInfo = extractAmount(row.metadata)
    if (amountInfo) {
      revenueTotal += amountInfo.amount
      revenueCurrency = amountInfo.currency
    }
  }

  return {
    totalStudents: profileSummary?.count ?? 0,
    activeSubscriptions,
    thirtyDayRevenue: revenueTotal,
    revenueCurrency,
  }
}

export async function fetchRecentEnrollments(limit = 5): Promise<AdminRecentEnrollment[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, user_id, created_at, classes ( title )")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Array<{ id: string; user_id: string; created_at: string; classes: { title: string | null } | null }>>()

  if (error) {
    throw new Error(`Unable to load enrollments: ${formatSupabaseError(error)}`)
  }

  const rows = (data ?? []) as EnrollmentRow[]
  const uniqueUserIds = Array.from(new Set(rows.map((row) => row.user_id)))
  const emailByUserId = new Map<string, string>()

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", uniqueUserIds)
      .returns<Array<{ id: string; email: string | null }>>()

    if (profilesError) {
      console.error("[admin] Unable to load profile emails for recent enrollments.", profilesError)
    } else {
      for (const profile of profiles ?? []) {
        if (profile.email) {
          emailByUserId.set(profile.id, profile.email)
        }
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: emailByUserId.get(row.user_id) ?? row.user_id,
    classTitle: row.classes?.title ?? "Unknown class",
    enrolledAt: row.created_at,
  }))
}

export async function fetchRecentPayments(limit = 5): Promise<AdminRecentPayment[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, metadata, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Unable to load payments: ${formatSupabaseError(error)}`)
  }

  const rows = (data ?? []) as unknown as SubscriptionPaymentRow[]
  const uniqueUserIds = Array.from(new Set(rows.map((row) => row.user_id)))
  const emailByUserId = new Map<string, string>()

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", uniqueUserIds)
      .returns<Array<{ id: string; email: string | null }>>()

    if (profilesError) {
      console.error("[admin] Unable to load profile emails for recent payments.", profilesError)
    } else {
      for (const profile of profiles ?? []) {
        if (profile.email) {
          emailByUserId.set(profile.id, profile.email)
        }
      }
    }
  }

  return rows.map((row) => {
    const amountInfo = extractAmount(row.metadata)
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: emailByUserId.get(row.user_id) ?? row.user_id,
      amount: amountInfo?.amount ?? 0,
      currency: amountInfo?.currency ?? "usd",
      status: row.status ?? "unknown",
      paidAt: row.updated_at ?? null,
    }
  })
}
