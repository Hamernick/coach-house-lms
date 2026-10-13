import { SupabaseManagerSurface } from "@/components/supabase-manager"
import { requireAdmin } from "@/lib/admin/auth"
import { env } from "@/lib/env"
import { resolveSupabaseProjectRef } from "@/lib/supabase/project-ref"

export default async function AdminPlatformPage() {
  await requireAdmin()

  const projectRef = resolveSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL)

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Internal platform</p>
        <h1 className="text-2xl font-semibold text-foreground">Supabase platform</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Internal-only operations surface for database, auth, storage, logs, secrets, and AI SQL.
          This keeps the stock Platform Kit tooling inside the main admin shell instead of hiding it
          behind a detached route.
        </p>
      </header>

      {projectRef ? (
        <div className="min-h-0 flex-1">
          <SupabaseManagerSurface
            projectRef={projectRef}
            className="h-[calc(100vh-15.5rem)] min-h-[720px] bg-background"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to determine the Supabase project ref from <code>NEXT_PUBLIC_SUPABASE_URL</code>.
        </div>
      )}
    </div>
  )
}
