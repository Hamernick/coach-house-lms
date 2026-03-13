import { Alert, AlertDescription } from "@/components/ui/alert"
import { SupabaseManagerSurface } from "@/components/supabase-manager"
import { requireAdmin } from "@/lib/admin/auth"
import { env } from "@/lib/env"
import { hasSupabaseManagementApiToken } from "@/lib/supabase/management-api-config"
import { resolveSupabaseProjectRef } from "@/lib/supabase/project-ref"
import { AdminPlatformSetupToast } from "./admin-platform-setup-toast"

export default async function AdminPlatformPage() {
  await requireAdmin()

  const projectRef = resolveSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL)
  const hasManagementApiToken = hasSupabaseManagementApiToken()

  return (
    <div className="-m-[var(--shell-content-pad)] flex min-h-full flex-1 flex-col overflow-hidden">
      {!hasManagementApiToken ? <AdminPlatformSetupToast /> : null}

      {projectRef ? (
        <div className="min-h-0 flex-1">
          <SupabaseManagerSurface
            projectRef={projectRef}
            className="h-full min-h-full rounded-none border-0 bg-background shadow-none"
          />
        </div>
      ) : (
        <div className="flex min-h-full flex-1 items-center justify-center p-6">
          <Alert className="max-w-xl rounded-2xl border-destructive/30 bg-destructive/5">
            <AlertDescription className="text-destructive">
              Unable to determine the Supabase project ref from{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code>.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
