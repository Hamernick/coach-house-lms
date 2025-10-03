import { ClassOverview } from "@/components/training/class-overview"
import { getClassModulesForUser } from "@/lib/modules"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
 
// Static landing that relies on middleware for auth

type Params = { slug: string }

export default async function ClassLandingPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  let profile: { role: string | null } | null = null
  if (auth.user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle<{ role: string | null }>()
    profile = data ?? null
  }

  // Use existing server helper that already respects RLS and publication
  const classCtx = auth.user
    ? await getClassModulesForUser({ classSlug: slug, userId: auth.user.id })
    : null

  const c = classCtx
    ? {
        id: classCtx.classId,
        title: classCtx.classTitle,
        blurb: classCtx.classDescription ?? "",
        slug,
        modules: classCtx.modules.map((m) => ({ id: m.id, title: m.title, subtitle: m.description ?? undefined })),
      }
    : null

  return (
    <div className="px-4 lg:px-6 space-y-3">
      {profile?.role === 'admin' && classCtx ? (
        <div className="rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Admin shortcuts</span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline"><a href={`/admin/classes/${classCtx.classId}`}>Edit class</a></Button>
              <Button asChild size="sm" variant="outline"><a href={`/admin/classes/${classCtx.classId}`}>Add module</a></Button>
            </div>
          </div>
        </div>
      ) : null}
      {c ? (
        <ClassOverview c={c} />
      ) : (
        <div className="rounded-lg border bg-card/60 p-6 text-sm text-muted-foreground">Class not found.</div>
      )}
    </div>
  )
}
