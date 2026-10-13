import { redirect } from "next/navigation"

import { getClassModulesForUser } from "@/lib/modules"
import { buildModuleStates } from "@/lib/module-progress"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type Params = { slug: string }

export default async function AcceleratorClassRedirect({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) {
    redirect(`/login?redirect=/accelerator/class/${slug}`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  const classCtx = await getClassModulesForUser({
    classSlug: slug,
    userId: user.id,
    forceAdmin: profile?.role === "admin",
    supabase,
  })

  const moduleStates = buildModuleStates(classCtx.modules, classCtx.progressMap)
  const target = moduleStates.find((state) => !state.completed) ?? moduleStates[moduleStates.length - 1]

  if (!target) {
    redirect("/accelerator")
  }

  redirect(`/accelerator/class/${slug}/module/${target.module.idx}`)
}
