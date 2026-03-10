import { InternalSupabaseManagerLauncher } from '@/components/supabase-manager/internal-supabase-manager-launcher'
import { env } from '@/lib/env'

function getSupabaseProjectRef() {
  try {
    const hostname = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname
    const [projectRef] = hostname.split('.')
    return projectRef?.trim() || null
  } catch {
    return null
  }
}

export default function InternalSupabaseManagerPage() {
  const projectRef = getSupabaseProjectRef()

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Staff admin
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Supabase manager</h1>
        <p className="text-sm text-muted-foreground">
          This route is intentionally not linked in primary navigation.
        </p>
      </header>

      {projectRef ? (
        <InternalSupabaseManagerLauncher projectRef={projectRef} />
      ) : (
        <p className="text-sm text-destructive">
          Unable to determine Supabase project ref from NEXT_PUBLIC_SUPABASE_URL.
        </p>
      )}
    </div>
  )
}
