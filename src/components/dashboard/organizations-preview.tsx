import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function OrganizationsPreview() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  const profile = (row?.profile as Record<string, unknown> | null) ?? null
  const entries = profile ? Object.entries(profile).slice(0, 6) : []

  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>Preview of your organization profile.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet — complete assignments to populate.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entries.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border px-2 py-0.5 text-xs"
                title={String(value ?? "")}
              >
                {key}: {String(value ?? "")}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
