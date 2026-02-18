"use server"

import { createSupabaseAdminClient } from "@/lib/supabase"

type CreateTesterAccountInput = {
  email: string
  password: string
}

type CreateTesterAccountResult =
  | { ok: true; created: boolean; userId: string }
  | { ok: false; error: string }

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizePassword(value: string) {
  return value.trim()
}

function isEmailExistsError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  if (error.code === "email_exists") return true
  const message = (error.message ?? "").toLowerCase()
  return message.includes("already been registered") || message.includes("email exists")
}

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient()
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return null

    const match = (data.users ?? []).find((user) => (user.email ?? "").toLowerCase() === email)
    if (match) return match
    if (!data.users || data.users.length < perPage) return null
    page += 1
  }
}

export async function createTesterAccountAction(
  input: CreateTesterAccountInput,
): Promise<CreateTesterAccountResult> {
  const email = normalizeEmail(input.email)
  const password = normalizePassword(input.password)

  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email." }
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }

  const admin = createSupabaseAdminClient()

  const { data: createdData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      qa_tester: true,
      is_tester: true,
    },
  })

  let userId = createdData.user?.id ?? null
  let created = Boolean(createdData.user)

  if (!userId) {
    if (!isEmailExistsError(createError ?? undefined)) {
      return { ok: false, error: createError?.message ?? "Unable to create tester account." }
    }

    const existing = await findUserByEmail(email)
    if (!existing?.id) {
      return { ok: false, error: "An account already exists, but we could not access it right now." }
    }

    const mergedMetadata = {
      ...(existing.user_metadata ?? {}),
      qa_tester: true,
      is_tester: true,
    }
    await admin.auth.admin.updateUserById(existing.id, {
      user_metadata: mergedMetadata,
      email_confirm: true,
    })

    userId = existing.id
    created = false
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      is_tester: true,
    },
    { onConflict: "id" },
  )

  if (profileError) {
    return { ok: false, error: "Tester account created, but profile sync failed. Try signing in again." }
  }

  return { ok: true, created, userId }
}

