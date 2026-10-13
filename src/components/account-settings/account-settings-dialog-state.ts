import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { toast } from "@/lib/toast"
import { useAccountSettingsProfileLoader } from "./account-settings-dialog-profile-loader"
import {
  isMobileSettingsViewport,
  requestDeleteAccount,
  resolveErrorMessage,
  saveCommunicationPreferences,
  saveProfileSettings,
} from "./account-settings-dialog-state-helpers"
import type {
  UseAccountSettingsDialogStateArgs,
  UseAccountSettingsDialogStateResult,
} from "./account-settings-dialog-state-types"
import type {
  AccountSettingsErrorKey,
  AccountSettingsMobilePage,
  AccountSettingsTabKey,
} from "./types"

export function useAccountSettingsDialogState({
  open,
  initialTab,
  defaultName = "",
  defaultEmail = "",
  defaultMarketingOptIn,
  defaultNewsletterOptIn,
  defaultAcceleratorOverlayEnabled,
  onOpenChange,
}: UseAccountSettingsDialogStateArgs): UseAccountSettingsDialogStateResult {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [tab, _setTab] = useState<AccountSettingsTabKey>(initialTab)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [marketingOptIn, setMarketingOptIn] = useState(defaultMarketingOptIn)
  const [newsletterOptIn, setNewsletterOptIn] = useState(defaultNewsletterOptIn)
  const [acceleratorOverlayEnabled, setAcceleratorOverlayEnabled] = useState(defaultAcceleratorOverlayEnabled)
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
  const initialAcceleratorOverlayRef = useRef(defaultAcceleratorOverlayEnabled)

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
  const handleAcceleratorOverlayEnabledChange = (value: boolean) => {
    setAcceleratorOverlayEnabled(value)
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

  useAccountSettingsProfileLoader({
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
  })

  const isDirty = useMemo(() => dirty || dirtyRef.current, [dirty])

  const validate = () => {
    setErrors({})
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSaving(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        throw userError
      }
      const userId = userData?.user?.id
      if (!userId) {
        throw new Error("Unable to save settings. Please sign in again.")
      }

      if (tab === "profile") {
        const result = await saveProfileSettings({
          supabase,
          userId,
          firstName,
          lastName,
          phone,
          initialFirstName: initialFirstRef.current,
          initialLastName: initialLastRef.current,
          initialPhone: initialPhoneRef.current,
        })

        initialFirstRef.current = result.initialFirstName
        initialLastRef.current = result.initialLastName
        initialPhoneRef.current = result.initialPhone

        if (result.firstName !== firstName) {
          setFirstName(result.firstName)
        }
        if (result.lastName !== lastName) {
          setLastName(result.lastName)
        }
      } else if (tab === "communications") {
        const result = await saveCommunicationPreferences({
          supabase,
          marketingOptIn,
          newsletterOptIn,
          acceleratorOverlayEnabled,
          initialMarketingOptIn: initialMarketingRef.current,
          initialNewsletterOptIn: initialNewsletterRef.current,
          initialAcceleratorOverlayEnabled: initialAcceleratorOverlayRef.current,
        })
        initialMarketingRef.current = result.initialMarketingOptIn
        initialNewsletterRef.current = result.initialNewsletterOptIn
        initialAcceleratorOverlayRef.current = result.initialAcceleratorOverlayEnabled
      }

      dirtyRef.current = false
      setDirty(false)

      const isMobile = isMobileSettingsViewport()
      if (isMobile) {
        setMobilePage("menu")
        _setTab("profile")
        setJustSaved(false)
      }
      router.refresh()
      if (!isMobile) {
        setJustSaved(true)
      }
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to save settings."))
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
    const result = await requestDeleteAccount()
    if (!result.ok) {
      toast.error(result.message)
      if (result.sessionExpired) {
        await supabase.auth.signOut().catch(() => undefined)
        router.replace("/?section=login")
        router.refresh()
      }
      return false
    }

    try {
      await supabase.auth.signOut().catch(() => undefined)
      router.replace("/")
      router.refresh()
      return true
    } catch {
      toast.error("Unable to delete account.")
      return false
    }
  }

  const requestClose = () => {
    if (isDirty && !isSaving) {
      setConfirmClose(true)
      return
    }
    onOpenChange(false)
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
    acceleratorOverlayEnabled,
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
    handleMarketingOptInChange,
    handleNewsletterOptInChange,
    handleAcceleratorOverlayEnabledChange,
    handleFirstNameChange,
    handleLastNameChange,
    handlePhoneChange,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    applyAvatarUrl,
  }
}
