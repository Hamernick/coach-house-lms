import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { toast } from "@/lib/toast"
import type {
  AccountSettingsErrorKey,
  AccountSettingsMobilePage,
  AccountSettingsTabKey,
} from "./types"

type UseAccountSettingsDialogStateArgs = {
  open: boolean
  initialTab: AccountSettingsTabKey
  defaultName?: string | null
  defaultEmail?: string | null
  defaultMarketingOptIn: boolean
  defaultNewsletterOptIn: boolean
  onOpenChange: (next: boolean) => void
}

type ReturnType = {
  tab: AccountSettingsTabKey
  setTab: (tab: AccountSettingsTabKey) => void
  mobilePage: AccountSettingsMobilePage
  handleMobilePageChange: (page: AccountSettingsMobilePage) => void
  firstName: string
  lastName: string
  phone: string
  marketingOptIn: boolean
  newsletterOptIn: boolean
  newPassword: string
  confirmPassword: string
  isSaving: boolean
  justSaved: boolean
  isUpdatingPassword: boolean
  confirmClose: boolean
  setConfirmClose: (next: boolean) => void
  isDirty: boolean
  errors: Partial<Record<AccountSettingsErrorKey, string>>
  avatarUrl: string | null
  orgName: string
  email: string
  handleSave: () => Promise<void>
  handleUpdatePassword: () => Promise<void>
  handleDeleteAccount: () => Promise<void>
  requestClose: () => void
  handleMarketingOptInChange: (value: boolean) => void
  handleNewsletterOptInChange: (value: boolean) => void
  handleFirstNameChange: (value: string) => void
  handleLastNameChange: (value: string) => void
  handlePhoneChange: (value: string) => void
  handleNewPasswordChange: (value: string) => void
  handleConfirmPasswordChange: (value: string) => void
  applyAvatarUrl: (url: string) => void
}

export function useAccountSettingsDialogState({
  open,
  initialTab,
  defaultName = "",
  defaultEmail = "",
  defaultMarketingOptIn,
  defaultNewsletterOptIn,
  onOpenChange,
}: UseAccountSettingsDialogStateArgs): ReturnType {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [tab, _setTab] = useState<AccountSettingsTabKey>(initialTab)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [marketingOptIn, setMarketingOptIn] = useState(defaultMarketingOptIn)
  const [newsletterOptIn, setNewsletterOptIn] = useState(defaultNewsletterOptIn)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const dirtyRef = useRef(false)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<AccountSettingsErrorKey, string>>>({})
  const [mobilePage, setMobilePage] = useState<AccountSettingsMobilePage>("menu")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [orgName, setOrgName] = useState("")

  const email = defaultEmail ?? ""
  const initialFirstRef = useRef("")
  const initialLastRef = useRef("")
  const initialPhoneRef = useRef("")
  const initialMarketingRef = useRef(defaultMarketingOptIn)
  const initialNewsletterRef = useRef(defaultNewsletterOptIn)

  const markDirty = () => {
    dirtyRef.current = true
    setDirty(true)
  }

  const clearError = (key: AccountSettingsErrorKey) => {
    setErrors((prev) => {
      if (!prev?.[key]) {
        return prev
      }
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleFirstNameChange = (value: string) => {
    setFirstName(value)
    markDirty()
    clearError("firstName")
  }
  const handleLastNameChange = (value: string) => {
    setLastName(value)
    markDirty()
    clearError("lastName")
  }
  const handlePhoneChange = (value: string) => {
    setPhone(value)
    markDirty()
    clearError("phone")
  }
  const handleMarketingOptInChange = (value: boolean) => {
    setMarketingOptIn(value)
    markDirty()
  }
  const handleNewsletterOptInChange = (value: boolean) => {
    setNewsletterOptIn(value)
    markDirty()
  }
  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value)
  }
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
  }
  const handleMobilePageChange = (page: AccountSettingsMobilePage) => {
    if (page === "menu") {
      setMobilePage("menu")
      return
    }
    setMobilePage(page)
  }

  function setTab(tabKey: AccountSettingsTabKey) {
    _setTab(tabKey)
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMobilePage(tabKey)
    }
  }

  useEffect(() => {
    dirtyRef.current = false
    setDirty(false)
    setMobilePage("menu")
    setJustSaved(false)
  }, [open])

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

      const defaultFullName = (defaultName ?? "").trim()
      if (defaultFullName.includes(" ")) {
        const [first, ...rest] = defaultFullName.split(" ")
        setFirstName(first)
        setLastName(rest.join(" "))
      } else {
        setFirstName(defaultFullName)
        setLastName("")
      }
      initialFirstRef.current = defaultFullName.includes(" ")
        ? defaultFullName.split(" ")[0]
        : defaultFullName
      initialLastRef.current = defaultFullName.includes(" ")
        ? defaultFullName.split(" ").slice(1).join(" ")
        : ""
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
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", data.user.id)
          .maybeSingle<{ avatar_url: string | null }>()
        setAvatarUrl(profileRow?.avatar_url ?? null)

        const { data: orgRow } = await supabase
          .from("organizations")
          .select("profile")
          .eq("user_id", data.user.id)
          .maybeSingle<{ profile: Record<string, unknown> | null }>()
        const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
        setOrgName(String(profile.name ?? ""))
      }
    }

    void loadMeta()
  }, [open, defaultName, defaultMarketingOptIn, defaultNewsletterOptIn, supabase])

  const isDirty = useMemo(() => dirty || dirtyRef.current, [dirty])

  const validate = () => {
    setErrors({})
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (userId) {
        if (tab === "profile") {
          const initialFull = [initialFirstRef.current, initialLastRef.current]
            .filter(Boolean)
            .join(" ")
          const nextFull = [firstName, lastName].filter(Boolean).join(" ")
          if (initialFull !== nextFull) {
            await supabase
              .from("profiles")
              .upsert({ id: userId, full_name: nextFull || null }, { onConflict: "id" })
            initialFirstRef.current = firstName
            initialLastRef.current = lastName
          }
        }
      }

      if (tab === "profile") {
        if (phone !== initialPhoneRef.current) {
          await supabase.auth.updateUser({ data: { phone } })
          initialPhoneRef.current = phone
        }
      } else if (tab === "communications") {
        const meta: Record<string, unknown> = {}
        if (marketingOptIn !== initialMarketingRef.current) {
          meta.marketing_opt_in = marketingOptIn
        }
        if (newsletterOptIn !== initialNewsletterRef.current) {
          meta.newsletter_opt_in = newsletterOptIn
        }
        if (Object.keys(meta).length > 0) {
          await supabase.auth.updateUser({ data: meta })
          initialMarketingRef.current = marketingOptIn
          initialNewsletterRef.current = newsletterOptIn
        }
      }

      dirtyRef.current = false
      setDirty(false)

      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches
      if (isMobile) {
        setMobilePage("menu")
        _setTab("profile")
        setJustSaved(false)
      }
      router.refresh()
      if (!isMobile) {
        setJustSaved(true)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) return
    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message || "Unable to update password.")
        return
      }
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/account/delete", { method: "DELETE" })
    if (res.ok) {
      router.replace("/login")
      router.refresh()
    }
  }

  const requestClose = () => {
    if (isDirty && !isSaving) {
      setConfirmClose(true)
      return
    }
    onOpenChange(false)
  }

  const handleNewsletterOptIn = (value: boolean) => {
    handleNewsletterOptInChange(value)
  }

  const handleMarketingOptIn = (value: boolean) => {
    handleMarketingOptInChange(value)
  }

  const applyAvatarUrl = (url: string) => {
    setAvatarUrl(url)
  }

  return {
    tab,
    setTab,
    mobilePage,
    handleMobilePageChange,
    firstName,
    lastName,
    phone,
    marketingOptIn,
    newsletterOptIn,
    newPassword,
    confirmPassword,
    isSaving,
    justSaved,
    isUpdatingPassword,
    confirmClose,
    setConfirmClose,
    isDirty,
    errors,
    avatarUrl,
    orgName,
    email,
    handleSave,
    handleUpdatePassword,
    handleDeleteAccount,
    requestClose,
    handleMarketingOptInChange: handleMarketingOptIn,
    handleNewsletterOptInChange: handleNewsletterOptIn,
    handleFirstNameChange,
    handleLastNameChange,
    handlePhoneChange,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    applyAvatarUrl,
  }
}
