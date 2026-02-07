"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"

function randomModuleSlugSuffix() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 8).toLowerCase()
  }
  return Math.random().toString(36).slice(2, 10)
}

export async function createModuleAction(formData: FormData) {
  const classId = formData.get("classId")
  if (typeof classId !== "string" || classId.trim().length === 0) {
    return
  }

  const { supabase } = await requireAdmin()

  const { data: highestIdx, error: highestIdxError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("idx")
    .eq("class_id", classId)
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle<{ idx: number | null }>()

  if (highestIdxError) {
    throw supabaseErrorToError(highestIdxError, "Unable to load existing modules.")
  }

  const nextIdx = (highestIdx?.idx ?? 0) + 1
  const moduleSlug = `module-${randomModuleSlugSuffix()}`

  const { data: inserted, error: insertError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .insert({
      class_id: classId,
      idx: nextIdx,
      slug: moduleSlug,
      title: `Module ${nextIdx}`,
      is_published: false,
      published: false,
    })
    .select("id")
    .single<{ id: string }>()

  if (insertError || !inserted?.id) {
    throw supabaseErrorToError(insertError, "Unable to create module.")
  }

  revalidatePath(`/admin/classes/${classId}`)
  redirect(`/admin/modules/${inserted.id}`)
}
