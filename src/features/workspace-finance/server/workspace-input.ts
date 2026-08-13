import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import type {
  WorkspaceFinanceInput,
  WorkspaceFinanceOrganizationProgramInput,
} from "../types"
import { buildWorkspaceFinanceProgramInputs } from "../lib"
import { loadOrganizationFinanceEngagementEvents } from "./engagement-events"
import { loadOrganizationFinanceOpportunities } from "./opportunities"
import { loadOrganizationFinanceRecords } from "./records"
import { loadWorkspaceFinanceReadModel } from "./read-model"
import { loadOrganizationFinanceStripeConnection } from "./stripe-connection"
import { loadOrganizationFinanceAccess } from "./access"

export async function loadOrganizationWorkspaceFinanceInput({
  canManageAccess = false,
  orgId,
  programs,
  supabase,
}: {
  canManageAccess?: boolean
  orgId: string
  programs: WorkspaceFinanceOrganizationProgramInput[]
  supabase: SupabaseClient<Database>
}): Promise<WorkspaceFinanceInput> {
  const [finance, access] = await Promise.all([
    loadWorkspaceFinanceReadModel({
      programs: buildWorkspaceFinanceProgramInputs(programs),
      loadRecords: async () => {
        const [records, engagementEvents] = await Promise.all([
          loadOrganizationFinanceRecords({ orgId, supabase }),
          loadOrganizationFinanceEngagementEvents({ orgId, supabase }),
        ])

        return [...records, ...engagementEvents]
      },
      loadOpportunities: () =>
        loadOrganizationFinanceOpportunities({ orgId, supabase }),
      loadStripeConnection: () =>
        loadOrganizationFinanceStripeConnection({ orgId, supabase }),
    }),
    loadOrganizationFinanceAccess({
      canManage: canManageAccess,
      orgId,
      supabase,
    }),
  ])

  return { ...finance, access }
}
