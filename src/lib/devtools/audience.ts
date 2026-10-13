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
  role: string | null
  is_tester: boolean | null
}

type ProfileAudienceWithoutTester = {
  full_name: string | null
  avatar_url: string | null
  role: string | null
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
  const withTester = await supabase
    .from("profiles")
    .select("role, is_tester")
    .eq("id", userId)
    .maybeSingle<ProfileRowWithTester>()

  if (!withTester.error) {
    return {
      isAdmin: withTester.data?.role === "admin",
      isTester: Boolean(withTester.data?.is_tester) || fallbackIsTester,
    }
  }

  // Backward-compatible fallback for databases where `is_tester` has not been migrated yet.
  if (!isMissingTesterColumnError(withTester.error)) {
    return { isAdmin: false, isTester: fallbackIsTester }
  }

  const withoutTester = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<ProfileRowWithoutTester>()

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
  const withTester = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role, is_tester")
    .eq("id", userId)
    .maybeSingle<ProfileAudienceWithTester>()

  if (!withTester.error) {
    return {
      fullName: withTester.data?.full_name ?? null,
      avatarUrl: withTester.data?.avatar_url ?? null,
      isAdmin: withTester.data?.role === "admin",
      isTester: Boolean(withTester.data?.is_tester) || fallbackIsTester,
    }
  }

  if (!isMissingTesterColumnError(withTester.error)) {
    return {
      fullName: null,
      avatarUrl: null,
      isAdmin: false,
      isTester: fallbackIsTester,
    }
  }

  const withoutTester = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", userId)
    .maybeSingle<ProfileAudienceWithoutTester>()

  return {
    fullName: withoutTester.data?.full_name ?? null,
    avatarUrl: withoutTester.data?.avatar_url ?? null,
    isAdmin: withoutTester.data?.role === "admin",
    isTester: fallbackIsTester,
  }
}
