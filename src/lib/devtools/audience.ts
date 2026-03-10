import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

type DevtoolsAudienceOptions = {
  supabase: SupabaseClient<Database, "public">
  userId: string
  fallbackIsTester?: boolean
}

export type DevtoolsAudience = {
  isAdmin: boolean
  isTester: boolean
}

export type ProfileAudience = {
  fullName: string | null
  avatarUrl: string | null
  headline: string | null
  isAdmin: boolean
  isTester: boolean
}

type ProfileRowWithTester = {
  role: string | null
  is_tester: boolean | null
}

type ProfileRowWithoutTester = {
  role: string | null
}

type ProfileAudienceWithTester = {
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  role: string | null
  is_tester: boolean | null
}

type ProfileAudienceWithoutTester = {
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  role: string | null
}

type QueryResult<T> = {
  data: T | null
  error: unknown | null
}

function resolveIsTesterFlag({
  profileTesterValue,
  fallbackIsTester,
}: {
  profileTesterValue: boolean | null | undefined
  fallbackIsTester: boolean
}) {
  if (typeof profileTesterValue === "boolean") return profileTesterValue
  return fallbackIsTester
}

async function lookupProfileRow<T>({
  supabase,
  userId,
  columns,
}: {
  supabase: SupabaseClient<Database, "public">
  userId: string
  columns: string
}): Promise<QueryResult<T>> {
  try {
    const fromResult = supabase.from("profiles") as unknown as Record<string, unknown>
    if (typeof fromResult.select !== "function") {
      return { data: null, error: null }
    }
    const selected = (fromResult.select as (value: string) => unknown)(columns) as Record<string, unknown>
    if (typeof selected.eq !== "function") {
      return { data: null, error: null }
    }
    const filtered = (selected.eq as (column: string, value: string) => unknown)("id", userId) as Record<
      string,
      unknown
    >

    if (typeof filtered.maybeSingle === "function") {
      return (await (filtered.maybeSingle as () => Promise<QueryResult<T>>)()) ?? { data: null, error: null }
    }
    if (typeof filtered.single === "function") {
      return (await (filtered.single as () => Promise<QueryResult<T>>)()) ?? { data: null, error: null }
    }
    return { data: null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

function isMissingTesterColumnError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined
  return code === "42703"
}

export function resolveTesterMetadata(userMetadata: unknown): boolean {
  if (!userMetadata || typeof userMetadata !== "object" || Array.isArray(userMetadata)) return false
  const meta = userMetadata as Record<string, unknown>
  return meta.is_tester === true || meta.tester === true || meta.qa_tester === true
}

export async function resolveDevtoolsAudience({
  supabase,
  userId,
  fallbackIsTester = false,
}: DevtoolsAudienceOptions): Promise<DevtoolsAudience> {
  const withTester = await lookupProfileRow<ProfileRowWithTester>({
    supabase,
    userId,
    columns: "role, is_tester",
  })

  if (!withTester.error) {
    return {
      isAdmin: withTester.data?.role === "admin",
      isTester: resolveIsTesterFlag({
        profileTesterValue: withTester.data?.is_tester,
        fallbackIsTester,
      }),
    }
  }

  // Backward-compatible fallback for databases where `is_tester` has not been migrated yet.
  if (!isMissingTesterColumnError(withTester.error)) {
    return { isAdmin: false, isTester: fallbackIsTester }
  }

  const withoutTester = await lookupProfileRow<ProfileRowWithoutTester>({
    supabase,
    userId,
    columns: "role",
  })

  return {
    isAdmin: withoutTester.data?.role === "admin",
    isTester: fallbackIsTester,
  }
}

export async function resolveProfileAudience({
  supabase,
  userId,
  fallbackIsTester = false,
}: DevtoolsAudienceOptions): Promise<ProfileAudience> {
  const withTester = await lookupProfileRow<ProfileAudienceWithTester>({
    supabase,
    userId,
    columns: "full_name, avatar_url, headline, role, is_tester",
  })

  if (!withTester.error) {
    return {
      fullName: withTester.data?.full_name ?? null,
      avatarUrl: withTester.data?.avatar_url ?? null,
      headline: withTester.data?.headline ?? null,
      isAdmin: withTester.data?.role === "admin",
      isTester: resolveIsTesterFlag({
        profileTesterValue: withTester.data?.is_tester,
        fallbackIsTester,
      }),
    }
  }

  if (!isMissingTesterColumnError(withTester.error)) {
    return {
      fullName: null,
      avatarUrl: null,
      headline: null,
      isAdmin: false,
      isTester: fallbackIsTester,
    }
  }

  const withoutTester = await lookupProfileRow<ProfileAudienceWithoutTester>({
    supabase,
    userId,
    columns: "full_name, avatar_url, headline, role",
  })

  return {
    fullName: withoutTester.data?.full_name ?? null,
    avatarUrl: withoutTester.data?.avatar_url ?? null,
    headline: withoutTester.data?.headline ?? null,
    isAdmin: withoutTester.data?.role === "admin",
    isTester: fallbackIsTester,
  }
}
