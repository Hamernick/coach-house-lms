import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import {
  buildGrantsGovSearchRequest,
  GRANTS_GOV_SEARCH_ENDPOINT,
  GRANTS_GOV_SOURCE_KEY,
  mapGrantsGovSearchResponse,
} from "../lib/grants-gov"
import { ingestRegisteredWorkspaceFinanceOpportunities } from "./ingest-opportunities"

const GRANTS_GOV_RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024
const GRANTS_GOV_TIMEOUT_MS = 10_000

export async function scanGrantsGovWorkspaceFinanceOpportunities({
  orgId,
  keyword,
  trustedClient,
  fetchImpl = fetch,
  observedAt = new Date().toISOString(),
}: {
  orgId: string
  keyword: string
  trustedClient: SupabaseClient<Database>
  fetchImpl?: typeof fetch
  observedAt?: string
}) {
  const request = buildGrantsGovSearchRequest({ keyword })
  if (!request) throw new Error("The Grants.gov search is invalid.")

  return ingestRegisteredWorkspaceFinanceOpportunities({
    orgId,
    sourceKey: GRANTS_GOV_SOURCE_KEY,
    trustedClient,
    loadCandidates: async () => {
      const response = await fetchImpl(GRANTS_GOV_SEARCH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(GRANTS_GOV_TIMEOUT_MS),
      })
      if (!response.ok) throw new Error("Grants.gov search is unavailable.")

      const responseText = await response.text()
      if (
        new TextEncoder().encode(responseText).byteLength >
        GRANTS_GOV_RESPONSE_LIMIT_BYTES
      ) {
        throw new Error("Grants.gov returned too much data.")
      }

      let responseData: unknown
      try {
        responseData = JSON.parse(responseText)
      } catch {
        throw new Error("Grants.gov returned an invalid response.")
      }
      const items = mapGrantsGovSearchResponse(responseData)
      if (!items) throw new Error("Grants.gov returned an invalid response.")
      return { observedAt, items }
    },
  })
}
