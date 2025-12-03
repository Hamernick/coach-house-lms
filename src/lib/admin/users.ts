import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

export type AdminUserSummary = {
  id: string
  email: string
  fullName: string | null
  role: "student" | "admin"
  lastSignInAt: string | null
  enrollmentCount: number
  subscriptionStatus: string | null
}

export type AdminUserListParams = {
  search?: string
  role?: "student" | "admin" | "all"
  status?: string
  perPage?: number
}

export async function listAdminUsers({
  search,
  role = "all",
  status,
  perPage = 200,
}: AdminUserListParams = {}): Promise<AdminUserSummary[]> {
  const admin = createSupabaseAdminClient()
  const { data: userList, error } = await admin.auth.admin.listUsers({ page: 1, perPage })

  if (error) {
    throw error
  }

  const users = userList.users
  if (users.length === 0) {
    return []
  }

  const supabase = await createSupabaseServerClient()
  const userIds = users.map((user) => user.id)

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, role, enrollments ( id ), subscriptions ( status, created_at )")
    .in("id", userIds)
    .returns<Array<{
      id: string
      full_name: string | null
      role: string | null
      enrollments?: { id: string }[] | null
      subscriptions?: { status: string | null; created_at: string | null }[] | null
    }>>()

  if (profilesError) {
    throw profilesError
  }

  const profileRecords = profiles ?? []
  const profileMap = new Map<string, (typeof profileRecords)[number]>()
  for (const profile of profileRecords) {
    profileMap.set(profile.id, profile)
  }

  return users
    .map((user) => {
      const profile = profileMap.get(user.id)
      const latestSubscription = profile?.subscriptions
        ? [...profile.subscriptions].sort((a, b) =>
            new Date(b.created_at ?? "1970").getTime() - new Date(a.created_at ?? "1970").getTime()
          )[0]
        : undefined

      const summary: AdminUserSummary = {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        role: (profile?.role ?? "student") as "student" | "admin",
        lastSignInAt: user.last_sign_in_at ?? null,
        enrollmentCount: profile?.enrollments?.length ?? 0,
        subscriptionStatus: latestSubscription?.status ?? null,
      }

      return summary
    })
    .filter((summary) => {
      const matchesRole = role === "all" || summary.role === role
      const matchesSearch = search
        ? summary.email.toLowerCase().includes(search.toLowerCase()) ||
          (summary.fullName ? summary.fullName.toLowerCase().includes(search.toLowerCase()) : false)
        : true
      const matchesStatus = status ? summary.subscriptionStatus === status : true
      return matchesRole && matchesSearch && matchesStatus
    })
    .sort((a, b) => (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email))
}

export type AdminUserDetail = {
  id: string
  email: string
  fullName: string | null
  role: "student" | "admin"
  lastSignInAt: string | null
  createdAt: string
  enrollments: Array<{
    id: string
    classId: string
    classSlug: string
    classTitle: string
    status: string
    enrolledAt: string
  }>
  moduleProgress: Array<{
    moduleId: string
    moduleTitle: string
    status: Database["public"]["Enums"]["module_progress_status"]
    completedAt: string | null
  }>
  subscription: {
    status: string
    currentPeriodEnd: string | null
    planName: string | null
  } | null
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const admin = createSupabaseAdminClient()

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError) {
    throw userError
  }

  if (!userData?.user) {
    return null
  }

  const supabase = await createSupabaseServerClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle<{ id: string; full_name: string | null; role: string | null; created_at: string }>()

  if (profileError) {
    throw profileError
  }

  if (!profile) {
    return null
  }

  const profileRecord = profile

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id, status, created_at, classes ( id, title, slug )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<Array<{
      id: string
      status: string | null
      created_at: string
      classes: { id: string; title: string | null; slug: string | null } | null
    }>>()

  if (enrollmentsError) {
    throw enrollmentsError
  }

  const { data: progress, error: progressError } = await supabase
    .from("module_progress")
    .select("module_id, status, completed_at, modules ( title )")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(10)
    .returns<Array<{
      module_id: string
      status: Database["public"]["Enums"]["module_progress_status"]
      completed_at: string | null
      modules: { title: string | null } | null
    }>>()

  if (progressError) {
    throw progressError
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; current_period_end: string | null; metadata: unknown }>()

  if (subscriptionError) {
    throw subscriptionError
  }

  const subscriptionRecord = subscription

  return {
    id: userId,
    email: userData.user.email ?? "",
    fullName:
      profileRecord.full_name ??
      (typeof userData.user.user_metadata?.full_name === "string" ? userData.user.user_metadata.full_name : null),
    role: (profileRecord.role ?? "student") as "student" | "admin",
    createdAt: profileRecord.created_at,
    lastSignInAt: userData.user.last_sign_in_at ?? null,
    enrollments: (enrollments ?? []).map((item) => ({
      id: item.id,
      classId: item.classes?.id ?? "",
      classSlug: item.classes?.slug ?? "",
      classTitle: item.classes?.title ?? "Unknown class",
      status: item.status ?? "enrolled",
      enrolledAt: item.created_at,
    })),
    moduleProgress: (progress ?? []).map((item) => ({
      moduleId: item.module_id,
      moduleTitle: item.modules?.title ?? "Unknown module",
      status: item.status,
      completedAt: item.completed_at,
    })),
    subscription: subscriptionRecord
      ? {
          status: subscriptionRecord.status ?? "inactive",
          currentPeriodEnd: subscriptionRecord.current_period_end,
          planName:
            typeof subscriptionRecord.metadata === "object" && subscriptionRecord.metadata
              ? (subscriptionRecord.metadata as Record<string, string | null>).planName ?? null
              : null,
        }
      : null,
  }
}
