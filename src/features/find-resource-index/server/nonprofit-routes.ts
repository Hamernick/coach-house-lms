import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"
import type { NonprofitDirectorySearchResponse } from "../nonprofit-types"
import {
  directoryCursor,
  directoryItemSchema,
  parseDirectoryQuery,
} from "./nonprofit-query"

function publicClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(5000) }),
      },
    }
  )
}
const headers = { "Cache-Control": "no-store" }

export async function nonprofitSearchGET(request: Request) {
  let input: ReturnType<typeof parseDirectoryQuery>
  try {
    input = parseDirectoryQuery(new URL(request.url).searchParams)
  } catch {
    return NextResponse.json(
      { error: "Invalid search parameters or cursor" },
      { status: 400, headers }
    )
  }
  try {
    const { data, error } = await publicClient().rpc(
      "search_nonprofit_directory_v2",
      {
        p_query: input.query,
        p_state: input.state,
        p_category: input.category,
        p_after: input.after,
        p_limit: input.limit + 1,
      }
    )
    if (error) throw error
    const results = directoryItemSchema
      .array()
      .max(input.limit + 1)
      .parse(data)
    const items = results.slice(0, input.limit),
      hasMore = results.length > input.limit
    const payload: NonprofitDirectorySearchResponse = {
      version: 1,
      items,
      page: {
        hasMore,
        limit: input.limit,
        nextCursor: hasMore
          ? directoryCursor(items.at(-1)!.ein, input.binding)
          : null,
      },
    }
    return NextResponse.json(payload, { headers })
  } catch {
    return NextResponse.json(
      { error: "The nonprofit directory is temporarily unavailable" },
      { status: 503, headers }
    )
  }
}

export async function nonprofitDetailGET(
  _request: Request,
  context: { params: Promise<{ ein: string }> }
) {
  const { ein } = await context.params
  if (!/^\d{9}$/.test(ein))
    return NextResponse.json({ error: "Invalid EIN" }, { status: 400, headers })
  try {
    const { data, error } = await publicClient().rpc(
      "get_nonprofit_directory",
      { p_ein: ein }
    )
    if (error) throw error
    if (data === null)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404, headers }
      )
    return NextResponse.json(
      { version: 1, item: directoryItemSchema.parse(data) },
      { headers }
    )
  } catch {
    return NextResponse.json(
      { error: "The nonprofit directory is temporarily unavailable" },
      { status: 503, headers }
    )
  }
}
