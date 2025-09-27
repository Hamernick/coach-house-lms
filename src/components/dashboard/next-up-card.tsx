import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function NextUpCard() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: nextId } = await supabase.rpc("next_unlocked_module", { p_user_id: user.id })

  if (!nextId) {
    return (
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Next up</CardTitle>
          <CardDescription>You&apos;re all caught up. Great job!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { data: mod } = await supabase
    .from("modules")
    .select("id, idx, title, class_id")
    .eq("id", nextId as string)
    .maybeSingle()

  if (!mod) {
    return null
  }

  const { data: klass } = await supabase
    .from("classes")
    .select("id, slug, title")
    .eq("id", mod.class_id)
    .maybeSingle()

  if (!klass) return null

  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>Next up</CardTitle>
        <CardDescription>{klass.title}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Module {mod.idx}: {mod.title}</p>
          <p className="truncate text-xs text-muted-foreground">Continue where you left off.</p>
        </div>
        <Button asChild size="sm">
          <a href={`/class/${klass.slug}/module/${mod.idx}`}>Resume</a>
        </Button>
      </CardContent>
    </Card>
  )
}
