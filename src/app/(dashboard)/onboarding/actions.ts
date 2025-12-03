"use server"

import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { uploadAvatarWithUser } from "@/lib/storage/avatars"

export async function completeOnboardingAction(form: FormData) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/dashboard")

  const first = String(form.get("firstName") || "").trim()
  const last = String(form.get("lastName") || "").trim()
  const phone = String(form.get("phone") || "").trim()
  const email = String(form.get("email") || "").trim()
  const optInUpdates = form.get("optInUpdates") ? true : false
  const orgName = String(form.get("orgName") || "").trim()
  const orgDesc = String(form.get("orgDesc") || "").trim()
  const website = String(form.get("website") || "").trim()
  const social = String(form.get("social") || "").trim()
  const applyingAs = String(form.get("applyingAs") || "").trim()
  const stage = String(form.get("stage") || "").trim()
  const problem = String(form.get("problem") || "").trim()
  const mission = String(form.get("mission") || "").trim()
  const goals = String(form.get("goals") || "").trim()
  const notes = String(form.get("confidenceNotes") || "").trim()
  const followUpLater = form.get("followUpLater") === "on"

  const toScore = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return null
    const clamped = Math.round(parsed)
    if (clamped < 1 || clamped > 10) return null
    return clamped
  }

  const confidenceOperating = toScore(form.get("confidenceOperating"))
  const confidenceFunding = toScore(form.get("confidenceFunding"))
  const confidenceFunders = toScore(form.get("confidenceFunders"))

  let avatarUrl: string | null = null
  const avatar = form.get("avatar")
  if (avatar instanceof File && avatar.size > 0) {
    avatarUrl = await uploadAvatarWithUser({ client: supabase, userId: user.id, file: avatar })
  }

  // Update profile full name, avatar, and marketing preferences
  await supabase
    .from("profiles")
    .update({
      full_name: [first, last].filter(Boolean).join(" "),
      avatar_url: avatarUrl,
      marketing_opt_in: optInUpdates,
    })
    .eq("id", user.id)

  // Upsert organization rollup from onboarding responses
  await supabase
    .from("organizations")
    .upsert(
      {
        user_id: user.id,
        profile: {
          name: orgName,
          description: orgDesc,
          website,
          social,
          applying_as: applyingAs,
          stage,
          problem,
          mission,
          goals,
        },
      },
      { onConflict: "user_id" }
    )

  // Update user metadata with onboarding fields
  await supabase.auth.updateUser({
    data: {
      onboarding_completed: true,
      marketing_opt_in: optInUpdates,
      phone,
      email,
      // A small echo in user_metadata is fine for client-side caching,
      // but the source of truth is organizations.profile (server-owned)
      organization: {
        name: orgName,
        description: orgDesc,
        website,
        social,
        applying_as: applyingAs,
        stage,
        problem,
        mission,
        goals,
      },
    },
  })

  if (confidenceOperating && confidenceFunding && confidenceFunders) {
    await supabase
      .from("onboarding_responses")
      .upsert(
        {
          user_id: user.id,
          org_id: user.id,
          confidence_operating: confidenceOperating,
          confidence_funding: confidenceFunding,
          confidence_funders: confidenceFunders,
          notes: notes.length > 0 ? notes : null,
          follow_up: followUpLater,
        },
        { onConflict: "user_id" }
      )
  }
}
