import { requireAdmin } from "@/lib/admin/auth"
import {
  PLATFORM_ADMIN_DASHBOARD_LAB_SOURCE_COMMIT,
  PLATFORM_ADMIN_DASHBOARD_LAB_SOURCE_REPO_URL,
  platformAdminDashboardLabActiveProjects,
  platformAdminDashboardLabNavItems,
  platformAdminDashboardLabProjects,
} from "./lib/platform-admin-dashboard-lab"
import type { PlatformAdminDashboardLabState } from "./types"

export async function loadPlatformAdminDashboardLabState(): Promise<PlatformAdminDashboardLabState> {
  const { supabase, userId } = await requireAdmin()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle<{ full_name: string | null; avatar_url: string | null }>()

  const name =
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    null
  const email =
    user?.email ??
    (typeof user?.user_metadata?.email === "string"
      ? user.user_metadata.email
      : null)
  const avatar =
    profile?.avatar_url ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    null

  return {
    user: { name, email, avatar },
    navItems: platformAdminDashboardLabNavItems,
    activeProjects: platformAdminDashboardLabActiveProjects,
    projects: platformAdminDashboardLabProjects,
    sourceCommit: PLATFORM_ADMIN_DASHBOARD_LAB_SOURCE_COMMIT,
    sourceRepoUrl: PLATFORM_ADMIN_DASHBOARD_LAB_SOURCE_REPO_URL,
  }
}
