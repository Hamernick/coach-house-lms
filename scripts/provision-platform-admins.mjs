#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

const VALID_ROLE = "admin"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase()
}

export function normalizePlatformAdminManifest(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("Platform admin manifest must be a JSON array.")
  }

  const seenEmails = new Set()

  return raw.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Manifest entry ${index + 1} must be an object.`)
    }

    const record = entry
    const email = normalizeEmail(record.email)
    const fullName = normalizeText(record.fullName)
    const password = normalizeText(record.password)

    if (!email) {
      throw new Error(`Manifest entry ${index + 1} is missing an email.`)
    }

    if (seenEmails.has(email)) {
      throw new Error(`Manifest contains duplicate email '${email}'.`)
    }
    seenEmails.add(email)

    return {
      email,
      fullName: fullName || null,
      password: password || null,
      role: VALID_ROLE,
    }
  })
}

async function loadManifestFromFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath)
  const source = await fs.readFile(absolutePath, "utf8")
  const parsed = JSON.parse(source)
  return normalizePlatformAdminManifest(parsed)
}

async function findUserByEmail(adminClient, email) {
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(error.message)

    const match = (data.users ?? []).find((user) => (user.email ?? "").toLowerCase() === email)
    if (match) return match
    if (!data.users || data.users.length < perPage) break
    page += 1
  }

  return null
}

async function ensureProfileRole(adminClient, { userId, email, fullName }) {
  const payload = {
    id: userId,
    role: VALID_ROLE,
    email,
    ...(fullName ? { full_name: fullName } : {}),
  }

  const { error } = await adminClient.from("profiles").upsert(payload, { onConflict: "id" })
  if (error) {
    throw new Error(`Unable to upsert profile role for ${email}: ${error.message}`)
  }
}

async function createPlatformAdmin(adminClient, entry) {
  if (!entry.password) {
    throw new Error(`Cannot create ${entry.email} without a password in the manifest.`)
  }

  const {
    data: { user },
    error,
  } = await adminClient.auth.admin.createUser({
    email: entry.email,
    password: entry.password,
    email_confirm: true,
    user_metadata: entry.fullName ? { full_name: entry.fullName } : undefined,
  })

  if (error || !user) {
    throw new Error(`Unable to create ${entry.email}: ${error?.message ?? "Unknown error"}`)
  }

  await ensureProfileRole(adminClient, {
    userId: user.id,
    email: entry.email,
    fullName: entry.fullName,
  })

  return { action: "created", userId: user.id }
}

async function updateExistingPlatformAdmin(adminClient, existingUser, entry) {
  const updatePayload = {
    email_confirm: true,
    ...(entry.fullName ? { user_metadata: { ...(existingUser.user_metadata ?? {}), full_name: entry.fullName } } : {}),
    ...(entry.password ? { password: entry.password } : {}),
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(existingUser.id, updatePayload)
  if (error) {
    throw new Error(`Unable to update ${entry.email}: ${error.message}`)
  }

  const resolvedUserId = data.user?.id ?? existingUser.id
  await ensureProfileRole(adminClient, {
    userId: resolvedUserId,
    email: entry.email,
    fullName: entry.fullName,
  })

  return { action: "updated", userId: resolvedUserId }
}

export async function provisionPlatformAdmins({
  manifestFile,
  dryRun = false,
  env = process.env,
  log = console.log,
}) {
  if (!manifestFile) {
    throw new Error("Missing manifest file. Use --file ./platform-admins.json")
  }

  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  }

  const manifest = await loadManifestFromFile(manifestFile)

  if (manifest.length === 0) {
    throw new Error("Manifest is empty.")
  }

  const adminClient = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const summary = []

  for (const entry of manifest) {
    const existingUser = await findUserByEmail(adminClient, entry.email)

    if (dryRun) {
      summary.push({
        email: entry.email,
        action: existingUser ? "would-update" : "would-create",
        hasPassword: Boolean(entry.password),
      })
      continue
    }

    const result = existingUser
      ? await updateExistingPlatformAdmin(adminClient, existingUser, entry)
      : await createPlatformAdmin(adminClient, entry)

    summary.push({
      email: entry.email,
      action: result.action,
      userId: result.userId,
      passwordChanged: Boolean(entry.password),
    })
  }

  for (const item of summary) {
    log(
      [
        `${item.action}: ${item.email}`,
        "userId" in item && item.userId ? `user_id=${item.userId}` : null,
        "passwordChanged" in item ? `password_set=${item.passwordChanged ? "yes" : "no"}` : null,
        "hasPassword" in item ? `password_in_manifest=${item.hasPassword ? "yes" : "no"}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
    )
  }

  return summary
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs

  const { values } = parseArgs({
    args,
    options: {
      file: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
    allowPositionals: false,
  })

  await provisionPlatformAdmins({
    manifestFile: values.file || process.env.PLATFORM_ADMIN_MANIFEST_FILE || null,
    dryRun: values["dry-run"],
  })
}

const currentFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null

if (invokedPath && invokedPath === currentFilePath) {
  main().catch((error) => {
    console.error("Failed to provision platform admins:", error.message)
    process.exit(1)
  })
}
