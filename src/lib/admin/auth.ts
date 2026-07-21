import { redirect } from "next/navigation"
import { cache } from "react"

import {
  hasPlatformCapability,
  resolveLegacyPlatformAccessLevel,
  type PlatformAccessLevel,
  type PlatformCapability,
} from "@/features/platform-access"
import { loadPlatformAccessLevel } from "@/lib/admin/platform-access"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"

type RequireAdminResult = {
  supabase: SupabaseClient<Database>
  userId: string
}

export type RequirePlatformCapabilityResult = RequireAdminResult & {
  accessLevel: PlatformAccessLevel
}

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== "object") return String(error)
  const record = error as Record<string, unknown>
  const code = typeof record.code === "string" ? record.code : null
  const message = typeof record.message === "string" ? record.message : null
  const details = typeof record.details === "string" ? record.details : null
  return [code, message, details].filter(Boolean).join(" — ") || "Unknown error"
}

const resolveCurrentPlatformActor = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    console.error("[admin-auth] Unable to load Supabase user.", userError)
    throw new Error("Unable to verify platform access.")
  }

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  if (error) {
    throw new Error(
      `Unable to verify admin access: ${formatSupabaseError(error)}`
    )
  }

  const storedAccessLevel = await loadPlatformAccessLevel({
    supabase,
    userId: user.id,
  })
  const accessLevel =
    storedAccessLevel ?? resolveLegacyPlatformAccessLevel(profile?.role)

  return { supabase, userId: user.id, accessLevel }
})

export async function requirePlatformCapability(
  capability: PlatformCapability,
  options: {
    loginRedirect?: string
    forbiddenRedirect?: string
  } = {}
): Promise<RequirePlatformCapabilityResult> {
  const actor = await resolveCurrentPlatformActor()

  if (!actor) {
    const loginRedirect = options.loginRedirect ?? "/internal"
    redirect(`/team/login?redirect=${encodeURIComponent(loginRedirect)}`)
  }

  if (
    !actor.accessLevel ||
    !hasPlatformCapability(actor.accessLevel, capability)
  ) {
    redirect(options.forbiddenRedirect ?? "/workspace")
  }

  return {
    supabase: actor.supabase,
    userId: actor.userId,
    accessLevel: actor.accessLevel,
  }
}

async function requireAdminInternal(): Promise<RequireAdminResult> {
  const actor = await requirePlatformCapability("platform", {
    loginRedirect: "/internal",
    forbiddenRedirect: "/organization",
  })

  return { supabase: actor.supabase, userId: actor.userId }
}

export const requireAdmin = cache(requireAdminInternal)
