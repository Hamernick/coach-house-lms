import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const migrationSql = readFileSync(
  "supabase/migrations/20260508113500_enable_rls_stripe_webhook_events.sql",
  "utf8",
)

describe("stripe webhook events RLS migration", () => {
  it("locks the webhook idempotency table away from Data API clients", () => {
    expect(migrationSql).toContain(
      "alter table public.stripe_webhook_events enable row level security;",
    )
    expect(migrationSql).toContain(
      "revoke all on table public.stripe_webhook_events from anon, authenticated;",
    )
    expect(migrationSql).not.toContain("create policy")
  })
})
