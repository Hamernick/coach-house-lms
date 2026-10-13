import { createClient } from "@supabase/supabase-js"
import { loadLocalEnv } from "../../../../scripts/resource-map/lib/env.mjs"

export function publicationClient(target) {
  loadLocalEnv()
  const raw = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!raw || !key)
    throw new Error(
      "Existing Supabase URL and service role environment required"
    )
  const url = new URL(raw)
  if (
    url.protocol !== "https:" ||
    url.hostname !== `${target}.supabase.co` ||
    url.username ||
    url.password ||
    url.port ||
    !/^[a-z0-9]{20}$/.test(target ?? "")
  )
    throw new Error(
      "Explicit --target must exactly match the configured Supabase project"
    )
  const client = createClient(url.origin, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(30000) }),
    },
  })
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const publicClient = anonKey
    ? createClient(url.origin, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          fetch: (input, init) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(30000) }),
        },
      })
    : null
  return {
    async publicRpc(name, args) {
      if (!publicClient)
        throw new Error("Anonymous key required for public canary")
      const { data, error } = await publicClient.rpc(name, args)
      if (error)
        throw new Error(
          `Anonymous directory RPC failed (${error.code ?? "network"})`
        )
      return data
    },
    async rpc(name, args) {
      const { data, error } = await client.rpc(name, args)
      if (error)
        throw new Error(
          `Directory RPC ${name} failed (${error.code ?? "network"})`
        )
      return data
    },
  }
}
