#!/usr/bin/env node
// Promotes an existing Supabase user by setting profiles.role='admin'.
// Requires env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, TARGET_EMAIL

import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetEmail = (process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase()
const role = (process.env.TARGET_ROLE || "admin").trim()

if (!url || !serviceRole) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.")
  console.error("Example:")
  console.error(
    "  TARGET_EMAIL=you@domain.com SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm promote:admin"
  )
  process.exit(1)
}

if (!targetEmail) {
  console.error("Missing TARGET_EMAIL (or ADMIN_EMAIL).")
  console.error("Example:")
  console.error("  TARGET_EMAIL=you@domain.com pnpm promote:admin")
  process.exit(1)
}

const adminClient = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(error.message)
    }

    const match = (data.users ?? []).find((user) => (user.email ?? "").toLowerCase() === email)
    if (match) return match
    if (!data.users || data.users.length < perPage) break
    page += 1
  }

  return null
}

async function main() {
  const user = await findUserByEmail(targetEmail)
  if (!user) {
    console.error(`No user found with email: ${targetEmail}`)
    process.exit(1)
  }

  const { error: upsertErr } = await adminClient.from("profiles").upsert(
    { id: user.id, role },
    { onConflict: "id" }
  )

  if (upsertErr) {
    console.error("Error updating profile role:", upsertErr.message)
    process.exit(1)
  }

  console.log("Updated profile role:")
  console.log(`  email: ${user.email}`)
  console.log(`  user_id: ${user.id}`)
  console.log(`  role: ${role}`)
}

main().catch((e) => {
  console.error("Unexpected error:", e)
  process.exit(1)
})

