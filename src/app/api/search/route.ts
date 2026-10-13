import { NextResponse } from "next/server"

import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { ITEMS } from "@/lib/marketplace/data"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { SearchResult } from "@/lib/search/types"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  buildMarketplaceHref,
  formatSearchRow,
  marketplaceCategoryLabel,
  matchesQuery,
  MAX_RESULTS,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  shouldOmitSearchRow,
} from "./_lib/helpers"
import {
  addActiveOrganizationResults,
  addFallbackResults,
  attachOrganizationImages,
  fetchIsAdmin,
} from "./_lib/query-sources"
import type { SearchRow } from "./_lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = (searchParams.get("q") ?? "").trim()
  if (rawQuery.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ results: [] }, { status: 401 })
  }

  const { orgId } = await resolveActiveOrganization(supabase, user.id)

  const isAdmin = await fetchIsAdmin(supabase, user.id)
  const entitlements = await fetchLearningEntitlements({
    supabase,
    userId: user.id,
    orgUserId: orgId,
    isAdmin,
  })
  const hasAcceleratorAccess =
    entitlements.hasAcceleratorAccess || entitlements.hasElectiveAccess

  const tokens = normalizeQuery(rawQuery)
  const results: SearchResult[] = []
  const seen = new Set<string>()

  const pushResult = (result: SearchResult) => {
    if (results.length >= MAX_RESULTS) return
    if (seen.has(result.id)) return
    seen.add(result.id)
    results.push(result)
  }

  const { data: rankedResults, error: rankedError } = await supabase
    .rpc("search_global", {
      p_query: rawQuery,
      p_user_id: user.id,
      p_is_admin: isAdmin,
      p_limit: MAX_RESULTS,
    })
    .returns<SearchRow[]>()

  if (!rankedError) {
    for (const row of rankedResults ?? []) {
      if (shouldOmitSearchRow(row)) continue
      pushResult(formatSearchRow(row))
    }
    if (orgId !== user.id) {
      await addActiveOrganizationResults({ supabase, orgId, tokens, pushResult })
    }
  } else {
    await addFallbackResults({ supabase, orgId, isAdmin, tokens, pushResult })
  }

  for (const item of ITEMS) {
    const primaryCategory = item.category[0]
    const categoryLabel = marketplaceCategoryLabel(primaryCategory)
    const searchableCategories = item.category
      .map((category) => marketplaceCategoryLabel(category))
      .filter(Boolean) as string[]
    if (
      matchesQuery(
        [item.name, item.description, item.byline ?? null, ...searchableCategories],
        tokens,
      )
    ) {
      pushResult({
        id: `marketplace-${item.id}`,
        label: item.name,
        subtitle: item.byline ?? categoryLabel ?? undefined,
        href: buildMarketplaceHref(primaryCategory, item.name),
        group: "Marketplace",
        image: item.image,
        keywords: [item.description, item.byline ?? "", ...searchableCategories].filter(
          Boolean,
        ),
      })
    }
  }

  const filtered = hasAcceleratorAccess
    ? results
    : results.filter((item) => !item.href.startsWith("/accelerator"))

  try {
    const trimmed = rawQuery.slice(0, 200)
    await supabase.from("search_events").insert({
      user_id: user.id,
      event_type: "query",
      query: trimmed,
      query_length: trimmed.length,
      context: searchParams.get("context"),
      result_count: filtered.length,
    })
  } catch {
    // Best-effort analytics; ignore failures.
  }

  const enriched = await attachOrganizationImages({
    supabase,
    orgId,
    results: filtered,
  })
  return NextResponse.json({ results: enriched })
}
