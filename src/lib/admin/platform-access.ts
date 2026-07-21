import type { SupabaseClient } from "@supabase/supabase-js"

import {
  isPlatformAccessLevel,
  resolveLegacyPlatformAccessLevel,
  type PlatformAccessLevel,
} from "@/features/platform-access"
import type { Database } from "@/lib/supabase"

type PlatformAccessRow = Pick<
  Database["public"]["Tables"]["platform_staff_members"]["Row"],
  "access_level"
>

function isMissingPlatformStaffTableError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: string }).code
      : undefined
  return code === "42P01" || code === "PGRST205"
}

export async function loadPlatformAccessLevel({
  supabase,
  userId,
  legacyProfileRole,
}: {
  supabase: SupabaseClient<Database, "public">
  userId: string
  legacyProfileRole?: string | null
}): Promise<PlatformAccessLevel | null> {
  const legacyAccessLevel = resolveLegacyPlatformAccessLevel(legacyProfileRole)

  try {
    const tableQuery = supabase.from("platform_staff_members") as unknown as {
      select?: (columns: string) => {
        eq?: (
          column: string,
          value: string
        ) => {
          maybeSingle?: () => Promise<{
            data: PlatformAccessRow | null
            error: unknown | null
          }>
        }
      }
    }
    const selected = tableQuery.select?.("access_level")
    const filtered = selected?.eq?.("user_id", userId)
    if (!filtered?.maybeSingle) return legacyAccessLevel

    const { data, error } = await filtered.maybeSingle()

    if (error) {
      if (isMissingPlatformStaffTableError(error)) return legacyAccessLevel
      throw error
    }

    return isPlatformAccessLevel(data?.access_level)
      ? data.access_level
      : legacyAccessLevel
  } catch (error) {
    if (isMissingPlatformStaffTableError(error)) return legacyAccessLevel
    throw error
  }
}
