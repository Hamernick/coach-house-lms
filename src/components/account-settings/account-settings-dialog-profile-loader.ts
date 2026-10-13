import { useEffect, type MutableRefObject } from "react"

import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { useSupabaseClient } from "@/hooks/use-supabase-client"

type ProfileIdentityRow = {
  full_name: string | null
  avatar_url: string | null
}

type UseAccountSettingsProfileLoaderArgs = {
  open: boolean
  supabase: ReturnType<typeof useSupabaseClient>
  defaultName: string | null
  defaultMarketingOptIn: boolean
  defaultNewsletterOptIn: boolean
  defaultAcceleratorOverlayEnabled: boolean
  setMarketingOptIn: (value: boolean) => void
  setNewsletterOptIn: (value: boolean) => void
  setAcceleratorOverlayEnabled: (value: boolean) => void
  setPhone: (value: string) => void
  setAvatarUrl: (value: string | null) => void
  setFirstName: (value: string) => void
  setLastName: (value: string) => void
  setOrgName: (value: string) => void
  initialFirstRef: MutableRefObject<string>
  initialLastRef: MutableRefObject<string>
  initialPhoneRef: MutableRefObject<string>
  initialMarketingRef: MutableRefObject<boolean>
  initialNewsletterRef: MutableRefObject<boolean>
  initialAcceleratorOverlayRef: MutableRefObject<boolean>
}

function splitName(value: string) {
  const normalized = value.trim()
  if (normalized.length === 0) {
    return { first: "", last: "" }
  }
  const [first, ...rest] = normalized.split(/\s+/)
  return { first: first ?? "", last: rest.join(" ") }
}

export function useAccountSettingsProfileLoader({
  open,
  supabase,
  defaultName,
  defaultMarketingOptIn,
  defaultNewsletterOptIn,
  defaultAcceleratorOverlayEnabled,
  setMarketingOptIn,
  setNewsletterOptIn,
  setAcceleratorOverlayEnabled,
  setPhone,
  setAvatarUrl,
  setFirstName,
  setLastName,
  setOrgName,
  initialFirstRef,
  initialLastRef,
  initialPhoneRef,
  initialMarketingRef,
  initialNewsletterRef,
  initialAcceleratorOverlayRef,
}: UseAccountSettingsProfileLoaderArgs) {
  useEffect(() => {
    async function loadMeta() {
      if (!open) return
      const { data } = await supabase.auth.getUser()
      const meta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>
      if (typeof meta.marketing_opt_in === "boolean") {
        setMarketingOptIn(meta.marketing_opt_in)
      }
      if (typeof meta.newsletter_opt_in === "boolean") {
        setNewsletterOptIn(meta.newsletter_opt_in)
      }
      if (typeof meta.accelerator_overlay_enabled === "boolean") {
        setAcceleratorOverlayEnabled(meta.accelerator_overlay_enabled)
      }
      if (typeof meta.phone === "string") {
        setPhone(String(meta.phone))
      }

      initialPhoneRef.current = typeof meta.phone === "string" ? String(meta.phone) : ""
      initialMarketingRef.current =
        typeof meta.marketing_opt_in === "boolean"
          ? (meta.marketing_opt_in as boolean)
          : defaultMarketingOptIn
      initialNewsletterRef.current =
        typeof meta.newsletter_opt_in === "boolean"
          ? (meta.newsletter_opt_in as boolean)
          : defaultNewsletterOptIn
      initialAcceleratorOverlayRef.current =
        typeof meta.accelerator_overlay_enabled === "boolean"
          ? (meta.accelerator_overlay_enabled as boolean)
          : defaultAcceleratorOverlayEnabled

      if (data?.user?.id) {
        const { orgId: activeOrgId } = await resolveActiveOrganization(supabase, data.user.id)

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.user.id)
          .maybeSingle<ProfileIdentityRow>()
        setAvatarUrl(profileRow?.avatar_url ?? null)

        const profileFullName = typeof profileRow?.full_name === "string" ? profileRow.full_name.trim() : ""
        const defaultFullName = (defaultName ?? "").trim()
        const metadataFullName = typeof meta.full_name === "string" ? String(meta.full_name).trim() : ""
        const resolvedFullName = profileFullName || defaultFullName || metadataFullName
        const { first, last } = splitName(resolvedFullName)
        setFirstName(first)
        setLastName(last)
        initialFirstRef.current = first
        initialLastRef.current = last

        const { data: orgRow } = await supabase
          .from("organizations")
          .select("profile")
          .eq("user_id", activeOrgId)
          .maybeSingle<{ profile: Record<string, unknown> | null }>()
        const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
        setOrgName(String(profile.name ?? ""))
      }
    }

    void loadMeta()
  }, [
    open,
    defaultName,
    defaultMarketingOptIn,
    defaultNewsletterOptIn,
    defaultAcceleratorOverlayEnabled,
    initialFirstRef,
    initialLastRef,
    initialAcceleratorOverlayRef,
    initialMarketingRef,
    initialNewsletterRef,
    initialPhoneRef,
    setAcceleratorOverlayEnabled,
    setAvatarUrl,
    setFirstName,
    setLastName,
    setMarketingOptIn,
    setNewsletterOptIn,
    setOrgName,
    setPhone,
    supabase,
  ])
}
