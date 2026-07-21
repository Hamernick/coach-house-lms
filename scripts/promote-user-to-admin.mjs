#!/usr/bin/env node
// Sets an existing Supabase user's internal platform access.
// Requires env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, TARGET_EMAIL

import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetEmail = (process.env.TARGET_EMAIL || process.env.ADMIN_EMAIL || "")
  .trim()
  .toLowerCase()
const role = (process.env.TARGET_ROLE || "admin").trim()
const accessLevel = (process.env.TARGET_ACCESS_LEVEL || "developer").trim()
if (accessLevel !== "developer" && accessLevel !== "coach") {
  console.error("TARGET_ACCESS_LEVEL must be 'developer' or 'coach'.")
  process.exit(1)
}

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
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) {
      throw new Error(error.message)
    }

    const match = (data.users ?? []).find(
      (user) => (user.email ?? "").toLowerCase() === email
    )
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

  const { error: accessErr } = await adminClient
    .from("platform_staff_members")
    .upsert(
      { user_id: user.id, access_level: accessLevel },
      { onConflict: "user_id" }
    )
  if (accessErr) {
    console.error("Error updating platform access:", accessErr.message)
    process.exit(1)
  }

  const { error: upsertErr } = await adminClient.from("profiles").upsert(
    {
      id: user.id,
      role: accessLevel === "developer" ? role : "member",
    },
    { onConflict: "id" }
  )

  if (upsertErr) {
    console.error("Error updating profile role:", upsertErr.message)
    process.exit(1)
  }

  console.log("Updated profile role:")
  console.log(`  email: ${user.email}`)
  console.log(`  user_id: ${user.id}`)
  console.log(
    `  profile_role: ${accessLevel === "developer" ? role : "member"}`
  )
  console.log(`  access_level: ${accessLevel}`)
}

main().catch((e) => {
  console.error("Unexpected error:", e)
  process.exit(1)
})

