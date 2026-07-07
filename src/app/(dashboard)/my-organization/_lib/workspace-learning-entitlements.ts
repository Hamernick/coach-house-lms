import {
  fetchLearningEntitlements,
  type LearningEntitlements,
} from "@/lib/accelerator/entitlements"
import { shouldForceStripeEntitlementSyncForWorkspace } from "@/lib/workspace/member-workspace-nav-access"
import type { Database } from "@/lib/supabase/types"
import type { SupabaseClient } from "@supabase/supabase-js"

type WorkspaceEntitlementsSupabase = SupabaseClient<Database, "public">

const WORKSPACE_ENTITLEMENT_FALLBACK: LearningEntitlements = {
  hasAcceleratorPurchase: false,
  hasActiveSubscription: false,
  hasAcceleratorAccess: false,
  hasElectiveAccess: false,
  ownedElectiveModuleSlugs: [],
}

export async function loadWorkspaceLearningEntitlements({
  isAdmin,
  orgId,
  supabase,
  userId,
}: {
  isAdmin: boolean
  orgId: string
  supabase: WorkspaceEntitlementsSupabase
  userId: string
}) {
  try {
    return await fetchLearningEntitlements({
      supabase,
      userId,
      orgUserId: orgId,
      isAdmin,
      forceStripeSync: shouldForceStripeEntitlementSyncForWorkspace({
        isAdmin,
      }),
    })
  } catch (error) {
    console.warn("Unable to load workspace entitlement state.", error)
    return WORKSPACE_ENTITLEMENT_FALLBACK
  }
}
