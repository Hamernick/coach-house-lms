"use server"

import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { ProfilesTable } from "@/lib/supabase/schema/tables"
import { uploadAvatarWithUser } from "@/lib/storage/avatars"

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "pricing",
  "billing",
  "class",
  "dashboard",
  "people",
  "my-organization",
  "_next",
  "public",
  "favicon",
  "assets",
])

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 60).replace(/^-+|-+$/g, "")
}

export async function completeOnboardingAction(form: FormData) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/my-organization")

  const first = String(form.get("firstName") || "").trim()
  const last = String(form.get("lastName") || "").trim()
  const phone = String(form.get("phone") || "").trim()
  const email = String(form.get("email") || "").trim()
  const title = String(form.get("title") || "").trim()
  const linkedin = String(form.get("linkedin") || "").trim()
  const marketingOptIn = Boolean(form.get("optInUpdates"))
  const newsletterOptIn = Boolean(form.get("newsletterOptIn"))

  const formationStatusRaw = String(form.get("formationStatus") || "").trim()
  const formationStatus =
    formationStatusRaw === "pre_501c3" || formationStatusRaw === "in_progress" || formationStatusRaw === "approved"
      ? formationStatusRaw
      : null

  const orgName = String(form.get("orgName") || "").trim()
  const orgSlugRaw = String(form.get("orgSlug") || "").trim()
  const normalizedSlug = slugify(orgSlugRaw || orgName)

  if (!orgName) {
    redirect("/my-organization?onboarding=1&error=missing_org_name")
  }
  if (!normalizedSlug) {
    redirect("/my-organization?onboarding=1&error=missing_org_slug")
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    redirect(`/my-organization?onboarding=1&error=invalid_org_slug&slug=${encodeURIComponent(normalizedSlug)}`)
  }
  if (RESERVED_SLUGS.has(normalizedSlug)) {
    redirect(`/my-organization?onboarding=1&error=reserved_org_slug&slug=${encodeURIComponent(normalizedSlug)}`)
  }

  const { count: slugCount, error: slugError } = await supabase
    .from("organizations")
    .select("user_id", { count: "exact", head: true })
    .ilike("public_slug", normalizedSlug)
    .neq("user_id", user.id)

  if (slugError) throw supabaseErrorToError(slugError, "Unable to validate organization URL.")
  if ((slugCount ?? 0) > 0) {
    redirect(`/my-organization?onboarding=1&error=slug_taken&slug=${encodeURIComponent(normalizedSlug)}`)
  }

  let avatarUrl: string | null = null
  const avatar = form.get("avatar")
  if (avatar instanceof File && avatar.size > 0) {
    avatarUrl = await uploadAvatarWithUser({ client: supabase, userId: user.id, file: avatar })
  }

  const fullName = [first, last].filter(Boolean).join(" ").trim()

  const profilePayload: ProfilesTable["Insert"] = { id: user.id }
  if (fullName.length > 0) profilePayload.full_name = fullName
  if (avatarUrl) profilePayload.avatar_url = avatarUrl
  if (title.length > 0) profilePayload.headline = title
  if (user.email) profilePayload.email = user.email

  await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" })

  const { data: existingOrg, error: existingOrgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (existingOrgError) throw supabaseErrorToError(existingOrgError, "Unable to load organization profile.")

  const nextProfile = {
    ...(existingOrg?.profile ?? {}),
    name: orgName,
    ...(formationStatus ? { formationStatus } : {}),
    ...(linkedin.length > 0 ? { linkedin } : {}),
  }

  const existingPeopleRaw = Array.isArray((existingOrg?.profile ?? {})?.org_people)
    ? ((existingOrg?.profile ?? {})?.org_people as Array<Record<string, unknown>>)
    : []
  const nextOwnerPerson = {
    id: user.id,
    name: fullName || email || user.email || "You",
    title: title.length > 0 ? title : null,
    email: email.length > 0 ? email : (user.email ?? null),
    linkedin: linkedin.length > 0 ? linkedin : null,
    category: "staff",
    image: avatarUrl,
    reportsToId: null,
    pos: null,
  }
  const nextPeople = [
    nextOwnerPerson,
    ...existingPeopleRaw.filter((person) => {
      if (!person || typeof person !== "object") return false
      const id = typeof person.id === "string" ? person.id : null
      if (id && id === user.id) return false
      const personEmail = typeof person.email === "string" ? person.email.toLowerCase() : null
      const ownerEmail = (nextOwnerPerson.email ?? "").toLowerCase()
      if (personEmail && ownerEmail && personEmail === ownerEmail) return false
      return true
    }),
  ]

  await supabase.from("organizations").upsert(
    {
      user_id: user.id,
      public_slug: normalizedSlug,
      profile: { ...nextProfile, org_people: nextPeople },
    },
    { onConflict: "user_id" },
  )

  // Update user metadata with onboarding + preference fields.
  await supabase.auth.updateUser({
    data: {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      marketing_opt_in: marketingOptIn,
      newsletter_opt_in: newsletterOptIn,
      phone: phone.length > 0 ? phone : null,
      email: email.length > 0 ? email : null,
    },
  })

  redirect("/my-organization?welcome=1")
}
