import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training/training-shell"
import { fetchSidebarTree } from "@/lib/academy"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

export default async function TrainingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  if (!user) {
    redirect("/login?redirect=/training")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isAdmin = profile?.role === "admin"

  const classes = await fetchSidebarTree({ includeDrafts: true, forceAdmin: !isAdmin })
  const classDefs = classes.map((klass) => ({
    id: klass.id,
    title: klass.title,
    blurb: klass.description ?? "",
    description: klass.description ?? "",
    slug: klass.slug,
    published: klass.published,
    modules: klass.modules.map((module) => ({
      id: module.id,
      title: module.title,
      subtitle: module.description ?? undefined,
      published: module.published,
    })),
  }))

  return (
    <div className="px-4 lg:px-6">
      <TrainingShell classes={classDefs} isAdmin={isAdmin} />
    </div>
  )
}
