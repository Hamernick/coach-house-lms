#!/usr/bin/env node
// Usage: node scripts/verify-account-settings.mjs <email>
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js"

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/verify-account-settings.mjs <email>")
  process.exit(1)
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRole) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY envs.")
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false } })

async function main() {
  // Lookup auth user by email
  const {
    data: { users },
    error: listErr,
  } = await admin.auth.admin.listUsers({ email })
  if (listErr) throw listErr
  const user = (users || []).find((u) => (u.email || "").toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error("No auth user found for:", email)
    process.exit(2)
  }

  const userId = user.id
  const meta = user.user_metadata || {}

  const { data: profile, error: profErr } = await admin.from("profiles").select("id, full_name, avatar_url").eq("id", userId).maybeSingle()
  if (profErr) throw profErr

  const { data: org, error: orgErr } = await admin.from("organizations").select("user_id, profile").eq("user_id", userId).maybeSingle()
  if (orgErr) throw orgErr

  const out = {
    auth: {
      id: userId,
      email: user.email,
      metadata: {
        phone: meta.phone || null,
        marketing_opt_in: meta.marketing_opt_in ?? null,
        newsletter_opt_in: meta.newsletter_opt_in ?? null,
      },
    },
    profiles: profile || null,
    organizations: org || null,
  }

  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error("verify failed:", e)
  process.exit(1)
})

