import type { components } from "@/lib/management-api-schema"
import { env } from "@/lib/env"
import { resolveSupabaseProjectRef } from "@/lib/supabase/project-ref"
import { requireAdmin } from "@/lib/admin/auth"
import { buildSupabaseAuthEmailPreviews } from "@/features/organization-access/lib/email-foundation"

type UpdateAuthConfigBody = components["schemas"]["UpdateAuthConfigBody"]

function buildSupabaseAuthTemplatePatch(): UpdateAuthConfigBody {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
  const previews = buildSupabaseAuthEmailPreviews(siteUrl)
  const byId = new Map(previews.map((preview) => [preview.id, preview]))

  return {
    mailer_subjects_confirmation:
      byId.get("supabase-confirm-sign-up")?.subject ?? "Confirm your email",
    mailer_subjects_invite:
      byId.get("supabase-invite-user")?.subject ?? "You have been invited",
    mailer_subjects_magic_link:
      byId.get("supabase-magic-link")?.subject ?? "Sign in to Coach House",
    mailer_subjects_email_change:
      byId.get("supabase-change-email")?.subject ??
      "Confirm your new Coach House email address",
    mailer_subjects_recovery:
      byId.get("supabase-reset-password")?.subject ??
      "Reset your Coach House password",
    mailer_subjects_reauthentication:
      byId.get("supabase-reauthentication")?.subject ??
      "Confirm your Coach House security check",
    mailer_templates_confirmation_content:
      byId.get("supabase-confirm-sign-up")?.html ?? null,
    mailer_templates_invite_content:
      byId.get("supabase-invite-user")?.html ?? null,
    mailer_templates_magic_link_content:
      byId.get("supabase-magic-link")?.html ?? null,
    mailer_templates_email_change_content:
      byId.get("supabase-change-email")?.html ?? null,
    mailer_templates_recovery_content:
      byId.get("supabase-reset-password")?.html ?? null,
    mailer_templates_reauthentication_content:
      byId.get("supabase-reauthentication")?.html ?? null,
  }
}

export async function syncSupabaseAuthEmailTemplates() {
  await requireAdmin()

  if (!env.SUPABASE_MANAGEMENT_API_TOKEN) {
    return {
      error:
        "SUPABASE_MANAGEMENT_API_TOKEN is not configured for this environment.",
    }
  }

  const projectRef = resolveSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL)
  if (!projectRef) {
    return { error: "Unable to resolve Supabase project ref." }
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.SUPABASE_MANAGEMENT_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSupabaseAuthTemplatePatch()),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    return {
      error: `Unable to sync Supabase auth templates: ${errorText || response.statusText}`,
    }
  }

  return { ok: true as const }
}
