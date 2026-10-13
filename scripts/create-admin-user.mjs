#!/usr/bin/env node
// Creates an admin test user in Supabase auth and promotes their profile role to 'admin'.
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error(
    "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Set these and re-run: npm run create:admin"
  )
  process.exit(1)
}

const adminClient = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function rand(n = 8) {
  const s = Math.random().toString(36).slice(2)
  return s.slice(0, n)
}

const email = process.env.ADMIN_EMAIL || `admin.test+${Date.now()}@example.com`
const password = process.env.ADMIN_PASSWORD || `TempPass!${rand(10)}`
const fullName = process.env.ADMIN_FULL_NAME || "Admin Test User"

async function main() {
  const {
    data: { user },
    error,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) {
    console.error("Error creating user:", error.message)
    process.exit(1)
  }

  const { error: upsertErr } = await adminClient.from("profiles").upsert(
    { id: user.id, role: "admin", full_name: fullName, email },
    { onConflict: "id" }
  )
  if (upsertErr) {
    console.error("Error promoting profile to admin:", upsertErr.message)
    process.exit(1)
  }

  console.log("Created admin test user:")
  console.log(`  email: ${email}`)
  console.log(`  password: ${password}`)
  console.log(`  user_id: ${user.id}`)
}

main().catch((e) => {
  console.error("Unexpected error:", e)
  process.exit(1)
})

