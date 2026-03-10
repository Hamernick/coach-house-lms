import { useEffect, type MutableRefObject } from "react"

import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { useSupabaseClient } from "@/hooks/use-supabase-client"

type ProfileIdentityRow = {
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  company: string | null
  contact: string | null
  about: string | null
}

type UseAccountSettingsProfileLoaderArgs = {
  open: boolean
  supabase: ReturnType<typeof useSupabaseClient>
  defaultName: string | null
  defaultMarketingOptIn: boolean
  defaultNewsletterOptIn: boolean
  setMarketingOptIn: (value: boolean) => void
  setNewsletterOptIn: (value: boolean) => void
  setPhone: (value: string) => void
  setAvatarUrl: (value: string | null) => void
  setFirstName: (value: string) => void
  setLastName: (value: string) => void
  setTitle: (value: string) => void
  setCompany: (value: string) => void
  setContact: (value: string) => void
  setAbout: (value: string) => void
  setOrgName: (value: string) => void
  initialFirstRef: MutableRefObject<string>
  initialLastRef: MutableRefObject<string>
  initialTitleRef: MutableRefObject<string>
  initialCompanyRef: MutableRefObject<string>
  initialContactRef: MutableRefObject<string>
  initialAboutRef: MutableRefObject<string>
  initialPhoneRef: MutableRefObject<string>
  initialMarketingRef: MutableRefObject<boolean>
  initialNewsletterRef: MutableRefObject<boolean>
}

function normalizeProfileText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
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
  setMarketingOptIn,
  setNewsletterOptIn,
  setPhone,
  setAvatarUrl,
  setFirstName,
  setLastName,
  setTitle,
  setCompany,
  setContact,
  setAbout,
  setOrgName,
  initialFirstRef,
  initialLastRef,
  initialTitleRef,
  initialCompanyRef,
  initialContactRef,
  initialAboutRef,
  initialPhoneRef,
  initialMarketingRef,
  initialNewsletterRef,
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

      if (data?.user?.id) {
        const { orgId: activeOrgId } = await resolveActiveOrganization(supabase, data.user.id)

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, headline, company, contact, about")
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
        const title = normalizeProfileText(profileRow?.headline)
        const company = normalizeProfileText(profileRow?.company)
        const contact = normalizeProfileText(profileRow?.contact)
        const about = normalizeProfileText(profileRow?.about)
        setTitle(title)
        setCompany(company)
        setContact(contact)
        setAbout(about)
        initialFirstRef.current = first
        initialLastRef.current = last
        initialTitleRef.current = title
        initialCompanyRef.current = company
        initialContactRef.current = contact
        initialAboutRef.current = about

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
    initialFirstRef,
    initialLastRef,
    initialTitleRef,
    initialCompanyRef,
    initialContactRef,
    initialAboutRef,
    initialMarketingRef,
    initialNewsletterRef,
    initialPhoneRef,
    setAvatarUrl,
    setAbout,
    setCompany,
    setContact,
    setFirstName,
    setLastName,
    setMarketingOptIn,
    setNewsletterOptIn,
    setOrgName,
    setPhone,
    setTitle,
    supabase,
  ])
}
