import { TrainingShell } from "@/components/training/training-shell"
import { fetchSidebarTree } from "@/lib/academy"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function TrainingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>()
    isAdmin = profile?.role === "admin"
  }

  const classes = await fetchSidebarTree({ includeDrafts: true, forceAdmin: !isAdmin })
  const classDefs = classes.map((klass) => ({
    id: klass.id,
    title: klass.title,
    blurb: klass.description ?? "",
    description: klass.description ?? "",
    slug: klass.slug,
    modules: klass.modules.map((module) => ({
      id: module.id,
      title: module.title,
      subtitle: module.description ?? undefined,
    })),
  }))

  return (
    <div className="px-4 lg:px-6">
      <TrainingShell classes={classDefs} isAdmin={isAdmin} />
    </div>
  )
}
