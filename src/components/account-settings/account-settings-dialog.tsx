"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import Cropper from "react-easy-crop"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSupabaseClient } from "@/hooks/use-supabase-client"

type TabKey = "profile" | "organization" | "communications" | "security" | "danger"

export function AccountSettingsDialog({
  open,
  onOpenChange,
  initialTab = "profile",
  defaultName = "",
  defaultEmail = "",
  defaultMarketingOptIn = true,
  defaultNewsletterOptIn = true,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  initialTab?: TabKey
  defaultName?: string | null
  defaultEmail?: string | null
  defaultMarketingOptIn?: boolean
  defaultNewsletterOptIn?: boolean
}) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB client-side guard (matches server)
  const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]) // client-side guard
  const [tab, _setTab] = useState<TabKey>(initialTab)
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const name = [firstName, lastName].filter(Boolean).join(" ")
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(defaultMarketingOptIn)
  const [newsletterOptIn, setNewsletterOptIn] = useState<boolean>(defaultNewsletterOptIn)
  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const dirtyRef = useRef(false)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Mobile stacked-sheet navigation: "menu" (root) or a tab key
  const [mobilePage, setMobilePage] = useState<"menu" | TabKey>("menu")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Organization fields
  const [orgName, setOrgName] = useState("")
  const [orgDesc, setOrgDesc] = useState("")
  const [website, setWebsite] = useState("")
  const [social, setSocial] = useState("")
  const [applyingAs, setApplyingAs] = useState<"individual" | "organization" | "">("")
  const [stage, setStage] = useState("")
  const [problem, setProblem] = useState("")
  const [mission, setMission] = useState("")
  const [goals, setGoals] = useState("")

  const email = defaultEmail ?? ""
  // Initial snapshots to compute diffs
  const initialFirstRef = useRef<string>("")
  const initialLastRef = useRef<string>("")
  const initialPhoneRef = useRef<string>("")
  const initialOrgRef = useRef<Record<string, unknown>>({})
  const initialMarketingRef = useRef<boolean>(defaultMarketingOptIn)
  const initialNewsletterRef = useRef<boolean>(defaultNewsletterOptIn)

  function setTab(tabKey: TabKey) {
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
      if (typeof meta.marketing_opt_in === "boolean") setMarketingOptIn(meta.marketing_opt_in as boolean)
      if (typeof meta.newsletter_opt_in === "boolean") setNewsletterOptIn(meta.newsletter_opt_in as boolean)
      if (typeof meta.phone === "string") setPhone(String(meta.phone))

      // Prefill name from defaultName
      const dn = (defaultName ?? "").trim()
      if (dn.includes(" ")) {
        const [f, ...rest] = dn.split(" ")
        setFirstName(f)
        setLastName(rest.join(" "))
      } else {
        setFirstName(dn)
        setLastName("")
      }
      initialFirstRef.current = (dn.includes(" ") ? dn.split(" ")[0] : dn) ?? ""
      initialLastRef.current = dn.includes(" ") ? dn.split(" ").slice(1).join(" ") : ""
      initialPhoneRef.current = typeof meta.phone === "string" ? String(meta.phone) : ""
      initialMarketingRef.current = typeof meta.marketing_opt_in === "boolean" ? (meta.marketing_opt_in as boolean) : defaultMarketingOptIn
      initialNewsletterRef.current = typeof meta.newsletter_opt_in === "boolean" ? (meta.newsletter_opt_in as boolean) : defaultNewsletterOptIn

      // Load current avatar and organization profile
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
        setOrgDesc(String(profile.description ?? ""))
        setWebsite(String(profile.website ?? ""))
        setSocial(String(profile.social ?? ""))
        {
          const raw = (profile.applying_as as string) ?? ""
          const normalized: "individual" | "organization" | "" =
            raw === "individual" || raw === "organization" ? (raw as "individual" | "organization") : ""
          setApplyingAs(normalized)
        }
        setStage(String(profile.stage ?? ""))
        setProblem(String(profile.problem ?? ""))
        setMission(String(profile.mission ?? ""))
        setGoals(String(profile.goals ?? ""))
        initialOrgRef.current = profile
      }
    }
    loadMeta()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isDirty = useMemo(() => dirty || dirtyRef.current, [dirty])

  function handleAvatarFileSelected(file?: File | null) {
    if (!file) return
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error("Unsupported image type. Use PNG, JPEG, or WebP.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image too large. Max size is 5 MB.")
      return
    }
    const url = URL.createObjectURL(file)
    setRawImageUrl(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedArea(null)
    setCropOpen(true)
  }

  function requestClose() {
    if (isDirty && !isSaving) {
      setConfirmClose(true)
      return
    }
    onOpenChange(false)
  }

  function validateForTab(): boolean {
    // Settings are lenient: allow partial edits; clear errors
    setErrors({})
    return true
  }

  async function handleSave() {
    if (!validateForTab()) return
    setIsSaving(true)
    try {
      // Update profile name
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (userId) {
        if (tab === "profile") {
          const initialFull = [initialFirstRef.current, initialLastRef.current].filter(Boolean).join(" ")
          const nextFull = name || ""
          if (initialFull !== nextFull) {
            await supabase
              .from("profiles")
              .upsert({ id: userId, full_name: nextFull || null }, { onConflict: "id" })
            initialFirstRef.current = firstName
            initialLastRef.current = lastName
          }
        }
      }
      // Update metadata depending on section (diff-aware)
      if (tab === "profile") {
        if (phone !== initialPhoneRef.current) {
          await supabase.auth.updateUser({ data: { phone } })
          initialPhoneRef.current = phone
        }
      } else if (tab === "communications") {
        const meta: Record<string, unknown> = {}
        if (marketingOptIn !== initialMarketingRef.current) meta.marketing_opt_in = marketingOptIn
        if (newsletterOptIn !== initialNewsletterRef.current) meta.newsletter_opt_in = newsletterOptIn
        if (Object.keys(meta).length > 0) {
          await supabase.auth.updateUser({ data: meta })
          initialMarketingRef.current = marketingOptIn
          initialNewsletterRef.current = newsletterOptIn
        }
      }
      // Upsert organization only when on organization tab
      if (userId && tab === "organization") {
        const nextProfile = {
          name: orgName,
          description: orgDesc,
          website,
          social,
          applying_as: applyingAs,
          stage,
          problem,
          mission,
          goals,
        }
        // Only upsert if anything changed
        const changed = JSON.stringify(nextProfile) !== JSON.stringify(initialOrgRef.current || {})
        if (changed) {
          await supabase
            .from("organizations")
            .upsert({ user_id: userId, profile: nextProfile }, { onConflict: "user_id" })
          initialOrgRef.current = nextProfile
        }
      }
      dirtyRef.current = false
      setDirty(false)
      // Navigate after save: on mobile return to menu; on desktop stay open and show Done
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      if (isMobile) {
        setMobilePage("menu")
        _setTab("profile")
        setJustSaved(false)
      }
      // Finally refresh to reflect updates (e.g., header avatar)
      router.refresh()
      if (!isMobile) setJustSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdatePassword() {
    if (!newPassword || newPassword !== confirmPassword) return
    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword("")
      setConfirmPassword("")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    // Calls server route that uses service role
    const res = await fetch("/api/account/delete", { method: "DELETE" })
    if (res.ok) {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <DialogContent
          className={cn(
            "h-[92vh] w-full max-w-none sm:w-[min(1120px,96%)] sm:max-w-[1120px] overflow-hidden p-0 top-auto bottom-0 left-1/2 translate-x-[-50%] translate-y-0 rounded-t-2xl sm:rounded-lg sm:top-1/2 sm:bottom-auto sm:translate-y-[-50%]",
            mobilePage !== "menu" ? "[&_[data-slot=dialog-close]]:hidden md:[&_[data-slot=dialog-close]]:block" : undefined
          )}
        >
          {/* Ensure scroll containers can shrink in flex layout */}
          <div className="flex h-full min-h-0 flex-col">
          {/* Desktop header */}
          <DialogHeader className="hidden border-b px-4 py-3 md:block">
            <DialogTitle>Account settings</DialogTitle>
            <DialogDescription>Manage your profile, security, and account preferences.</DialogDescription>
          </DialogHeader>
          {/* Mobile header with Cancel/Save when in subpage */}
          <div className="border-b px-4 py-3 md:hidden">
            {/* Provide an accessible title even when visual title is customized */}
            <DialogTitle className="sr-only">Account settings</DialogTitle>
            {mobilePage === "menu" ? (
              <div className="text-center">
                <p className="text-base font-semibold">Settings</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button className="text-sm text-muted-foreground" onClick={() => setMobilePage("menu")}>Cancel</button>
                <p className="text-base font-semibold capitalize">{mobilePage.replace("_", " ")}</p>
                <button className="text-sm text-primary disabled:opacity-50" onClick={handleSave} disabled={!isDirty || isSaving}>
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* Body row: split layout on desktop, single column on mobile */}
          <div className="hidden grow min-h-0 md:flex">
            <aside className="w-[240px] shrink-0 border-r p-4 md:p-6">
              <nav className="grid gap-1">
                <SideLink label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
                <SideLink label="Organization" active={tab === "organization"} onClick={() => setTab("organization")} />
                <SideLink label="Communications" active={tab === "communications"} onClick={() => setTab("communications")} />
                <SideLink label="Security" active={tab === "security"} onClick={() => setTab("security")} />
                <Separator className="my-2" />
                <SideLink label="Danger zone" active={tab === "danger"} onClick={() => setTab("danger")} danger />
              </nav>
            </aside>
            <div className="flex grow min-h-0">
            <section className="w-full min-h-0 overflow-y-auto p-4 md:p-6">
              {tab === "profile" && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-semibold">Profile</h3>
                    <p className="text-sm text-muted-foreground">Update your personal details.</p>
                  </header>
                  <div className="grid gap-4 max-w-xl">
                    <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative size-24 sm:size-28 overflow-hidden rounded-full border border-border bg-card" aria-busy={isUploadingAvatar}>
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {firstName.charAt(0).toUpperCase() || "A"}
                          {lastName.charAt(0).toUpperCase() || "A"}
                        </div>
                      )}
                      {isUploadingAvatar ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <Loader2 className="size-6 animate-spin" aria-hidden />
                        </div>
                      ) : null}
                    </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="avatarUpload" className={cn("cursor-pointer", isUploadingAvatar ? "pointer-events-none opacity-60" : undefined)}>
                          <input
                            id="avatarUpload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(ev) => handleAvatarFileSelected(ev.currentTarget.files?.[0] ?? null)}
                          />
                          <Button type="button" variant="outline" size="sm" disabled={isUploadingAvatar} asChild>
                            <span className="inline-flex items-center gap-2">
                              {isUploadingAvatar ? (<Loader2 className="size-4 animate-spin" aria-hidden />) : null}
                              {isUploadingAvatar ? "Uploading..." : "Add photo"}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="first">First name</Label>
                        <Input id="first" value={firstName} aria-invalid={Boolean(errors.firstName)} onChange={(e) => { setFirstName(e.currentTarget.value); setDirty(true); setErrors((p) => ({ ...p, firstName: "" })) }} />
                        {errors.firstName ? <p className="text-xs text-destructive">{errors.firstName}</p> : null}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="last">Last name</Label>
                        <Input id="last" value={lastName} aria-invalid={Boolean(errors.lastName)} onChange={(e) => { setLastName(e.currentTarget.value); setDirty(true); setErrors((p) => ({ ...p, lastName: "" })) }} />
                        {errors.lastName ? <p className="text-xs text-destructive">{errors.lastName}</p> : null}
                      </div>
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={phone} aria-invalid={Boolean(errors.phone)} onChange={(e) => { setPhone(e.currentTarget.value); setDirty(true); setErrors((p) => ({ ...p, phone: "" })) }} />
                      {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={email} disabled />
                    </div>
                  </div>
                </div>
              )}

              {tab === "organization" && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-semibold">Organization</h3>
                    <p className="text-sm text-muted-foreground">Update your organization or project details.</p>
                  </header>
                  <div className="grid gap-4 max-w-xl">
                    <div className="grid gap-2">
                      <Label htmlFor="orgName">Organization/Project Name</Label>
                      <Input id="orgName" value={orgName} aria-invalid={Boolean(errors.orgName)} onChange={(e) => { setOrgName(e.currentTarget.value); setDirty(true); setErrors((p) => ({ ...p, orgName: "" })) }} />
                      {errors.orgName ? <p className="text-xs text-destructive">{errors.orgName}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="orgDesc">Description</Label>
                      <textarea id="orgDesc" placeholder="Tell us about what you're building" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={orgDesc} onChange={(e) => { setOrgDesc(e.currentTarget.value); setDirty(true); setErrors((p) => ({ ...p, orgDesc: "" })) }} />
                      {errors.orgDesc ? <p className="text-xs text-destructive">{errors.orgDesc}</p> : null}
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">http://</span>
                          <Input id="website" placeholder="example.com" className="flex-1" value={website} onChange={(e) => { setWebsite(e.currentTarget.value); setDirty(true) }} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="social">Social username</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">@</span>
                          <Input id="social" placeholder="yourhandle" className="flex-1" value={social} onChange={(e) => { setSocial(e.currentTarget.value); setDirty(true) }} />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Applying as</Label>
                      <div className="mt-1 flex gap-4">
                        <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="applyingAs" value="individual" checked={applyingAs === 'individual'} onChange={() => { setApplyingAs('individual'); setDirty(true); setErrors((p) => ({ ...p, applyingAs: "" })) }} className="h-4 w-4"/> Individual</label>
                        <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="applyingAs" value="organization" checked={applyingAs === 'organization'} onChange={() => { setApplyingAs('organization'); setDirty(true); setErrors((p) => ({ ...p, applyingAs: "" })) }} className="h-4 w-4"/> Organization</label>
                      </div>
                      {errors.applyingAs ? <p className="text-xs text-destructive">{errors.applyingAs}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stage">Stage</Label>
                      <OrganizationStageSelect
                        id="stage"
                        value={stage}
                        onChange={(val) => { setStage(val); setDirty(true); setErrors((p) => ({ ...p, stage: "" })) }}
                        ariaInvalid={Boolean(errors.stage)}
                      />
                      {errors.stage ? <p className="text-xs text-destructive">{errors.stage}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="problem">Problem</Label>
                      <textarea id="problem" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" aria-invalid={Boolean(errors.problem)} value={problem} onChange={(e) => { setProblem(e.currentTarget.value); setDirty(true); setErrors((p) => ({ ...p, problem: "" })) }} />
                      {errors.problem ? <p className="text-xs text-destructive">{errors.problem}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mission">Mission</Label>
                      <textarea id="mission" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={mission} onChange={(e) => { setMission(e.currentTarget.value); setDirty(true) }} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="goals">Goals</Label>
                      <textarea id="goals" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={goals} onChange={(e) => { setGoals(e.currentTarget.value); setDirty(true) }} />
                    </div>
                  </div>
                </div>
              )}

              {tab === "communications" && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-semibold">Communications</h3>
                    <p className="text-sm text-muted-foreground">Choose the updates you’d like to receive.</p>
                  </header>
                  <div className="grid gap-4 max-w-xl">
                    <div className="flex items-start gap-3 rounded-md border p-3">
                      <input
                        id="marketing"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4"
                        checked={marketingOptIn}
                        onChange={(e) => { setMarketingOptIn(e.currentTarget.checked); setDirty(true) }}
                      />
                      <div>
                        <Label htmlFor="marketing" className="text-sm font-medium">Product communication</Label>
                        <p className="text-sm text-muted-foreground">Updates about new features, tips, and offers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border p-3">
                      <input
                        id="newsletter"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4"
                        checked={newsletterOptIn}
                        onChange={(e) => { setNewsletterOptIn(e.currentTarget.checked); setDirty(true) }}
                      />
                      <div>
                        <Label htmlFor="newsletter" className="text-sm font-medium">Weekly newsletter</Label>
                        <p className="text-sm text-muted-foreground">Curated resources and Coach House news.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "security" && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-semibold">Security</h3>
                    <p className="text-sm text-muted-foreground">Change your password.</p>
                  </header>
                  <div className="grid gap-4 max-w-xl">
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.currentTarget.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                      />
                    </div>
                    <div>
                      <Button
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword || !newPassword || newPassword !== confirmPassword}
                      >
                        {isUpdatingPassword ? "Updating..." : "Update password"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {tab === "danger" && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-lg font-semibold text-destructive">Danger zone</h3>
                    <p className="text-sm text-muted-foreground">Delete your account and associated data.</p>
                  </header>
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm">This action is permanent and cannot be undone.</p>
                    <div className="mt-3">
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        Delete my account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
            </div>
          </div>

          {/* Mobile root menu */}
          <div className="min-h-0 grow overflow-y-auto p-2 md:hidden" hidden={mobilePage !== "menu"}>
            <div className="px-2 pt-2 text-xs font-semibold text-muted-foreground">Account</div>
            <div className="mt-2 rounded-xl border bg-card/60">
              {([
                { key: "profile", label: "Profile" },
                { key: "organization", label: "Organization" },
                { key: "communications", label: "Communications" },
                { key: "security", label: "Security" },
                { key: "danger", label: "Danger zone" },
              ] as { key: TabKey; label: string }[]).map((item, idx, arr) => (
                <button
                  key={item.key}
                  className={"flex w-full items-center justify-between px-4 py-3 text-left text-sm " + (idx < arr.length - 1 ? "border-b" : "")}
                  onClick={() => {
                    setTab(item.key)
                    setMobilePage(item.key)
                  }}
                >
                  <span>{item.label}</span>
                  <span aria-hidden className="text-muted-foreground">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile subpages (reuse tab content) */}
          <div className="min-h-0 grow overflow-y-auto p-4 md:hidden" hidden={mobilePage === "menu"}>
            {tab === "profile" && (
              <div className="space-y-6">
                <header>
                  <h3 className="text-sm font-semibold text-muted-foreground">Profile</h3>
                </header>
                <div className="grid gap-4 max-w-xl">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative size-24 sm:size-28 overflow-hidden rounded-full border border-border bg-card" aria-busy={isUploadingAvatar}>
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {firstName.charAt(0).toUpperCase() || "A"}
                          {lastName.charAt(0).toUpperCase() || "A"}
                        </div>
                      )}
                      {isUploadingAvatar ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <Loader2 className="size-6 animate-spin" aria-hidden />
                        </div>
                      ) : null}
                    </div>
                    <label htmlFor="avatarUploadMobile" className={cn("cursor-pointer", isUploadingAvatar ? "pointer-events-none opacity-60" : undefined)}>
                      <input id="avatarUploadMobile" type="file" accept="image/*" className="hidden" onChange={(e)=>handleAvatarFileSelected(e.currentTarget.files?.[0] ?? null)} />
                      <Button type="button" variant="outline" size="sm" disabled={isUploadingAvatar} asChild>
                        <span className="inline-flex items-center gap-2">
                          {isUploadingAvatar ? (<Loader2 className="size-4 animate-spin" aria-hidden />) : null}
                          {isUploadingAvatar?"Uploading...":"Add photo"}
                        </span>
                      </Button>
                    </label>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="m-first">First name</Label>
                      <Input id="m-first" value={firstName} onChange={(e)=>{setFirstName(e.currentTarget.value); setDirty(true)}} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="m-last">Last name</Label>
                      <Input id="m-last" value={lastName} onChange={(e)=>{setLastName(e.currentTarget.value); setDirty(true)}} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-phone">Phone</Label>
                    <Input id="m-phone" value={phone} onChange={(e)=>{setPhone(e.currentTarget.value); setDirty(true)}} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-email">Email</Label>
                    <Input id="m-email" value={email} disabled />
                  </div>
                </div>
              </div>
            )}
            {tab === "organization" && (
              <div className="space-y-6">
                <header>
                  <h3 className="text-sm font-semibold text-muted-foreground">Organization</h3>
                </header>
                <div className="grid gap-4 max-w-xl">
                  <div className="grid gap-2">
                    <Label htmlFor="m-orgName">Organization/Project Name</Label>
                    <Input id="m-orgName" value={orgName} onChange={(e)=>{setOrgName(e.currentTarget.value); setDirty(true)}} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-orgDesc">Description</Label>
                    <textarea id="m-orgDesc" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={orgDesc} onChange={(e)=>{setOrgDesc(e.currentTarget.value); setDirty(true)}} />
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="m-website">Website</Label>
                      <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">http://</span><Input id="m-website" className="flex-1" value={website} onChange={(e)=>{setWebsite(e.currentTarget.value); setDirty(true)}} /></div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="m-social">Social username</Label>
                      <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">@</span><Input id="m-social" className="flex-1" value={social} onChange={(e)=>{setSocial(e.currentTarget.value); setDirty(true)}} /></div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Applying as</Label>
                    <div className="mt-1 flex gap-4">
                      <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="m-applyingAs" value="individual" checked={applyingAs === 'individual'} onChange={()=>{setApplyingAs('individual'); setDirty(true)}} className="h-4 w-4"/> Individual</label>
                      <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="m-applyingAs" value="organization" checked={applyingAs === 'organization'} onChange={()=>{setApplyingAs('organization'); setDirty(true)}} className="h-4 w-4"/> Organization</label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-stage">Stage</Label>
                    <OrganizationStageSelect id="m-stage" value={stage} onChange={(val)=>{setStage(val); setDirty(true)}} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-problem">Problem</Label>
                    <textarea id="m-problem" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={problem} onChange={(e)=>{setProblem(e.currentTarget.value); setDirty(true)}} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-mission">Mission</Label>
                    <textarea id="m-mission" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={mission} onChange={(e)=>{setMission(e.currentTarget.value); setDirty(true)}} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-goals">Goals</Label>
                    <textarea id="m-goals" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={goals} onChange={(e)=>{setGoals(e.currentTarget.value); setDirty(true)}} />
                  </div>
                </div>
              </div>
            )}
            {tab === "communications" && (
              <div className="space-y-6">
                <header>
                  <h3 className="text-sm font-semibold text-muted-foreground">Communications</h3>
                </header>
                <div className="grid gap-4 max-w-xl">
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <input type="checkbox" className="mt-0.5 h-4 w-4" checked={marketingOptIn} onChange={(e)=>{setMarketingOptIn(e.currentTarget.checked); setDirty(true)}} />
                    <div>
                      <Label className="text-sm font-medium">Product communication</Label>
                      <p className="text-sm text-muted-foreground">Updates about new features, tips, and offers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <input type="checkbox" className="mt-0.5 h-4 w-4" checked={newsletterOptIn} onChange={(e)=>{setNewsletterOptIn(e.currentTarget.checked); setDirty(true)}} />
                    <div>
                      <Label className="text-sm font-medium">Weekly newsletter</Label>
                      <p className="text-sm text-muted-foreground">Curated resources and Coach House news.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tab === "security" && (
              <div className="space-y-6">
                <header>
                  <h3 className="text-sm font-semibold text-muted-foreground">Security</h3>
                </header>
                <div className="grid gap-4 max-w-xl">
                  <div className="grid gap-2">
                    <Label htmlFor="m-newPassword">New password</Label>
                    <Input id="m-newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e)=>setNewPassword(e.currentTarget.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-confirmPassword">Confirm password</Label>
                    <Input id="m-confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.currentTarget.value)} />
                  </div>
                </div>
              </div>
            )}
            {tab === "danger" && (
              <div className="space-y-6">
                <header>
                  <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
                </header>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm">This action is permanent and cannot be undone.</p>
                  <div className="mt-3"><Button variant="destructive" onClick={handleDeleteAccount}>Delete my account</Button></div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop footer */}
          <div className="hidden items-center justify-end gap-2 border-t px-4 py-3 md:flex">
            <Button variant="outline" onClick={requestClose}>
              {justSaved ? "Close" : "Cancel"}
            </Button>
            {justSaved ? (
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving || !isDirty}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            )}
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar cropper */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="w-[min(720px,92%)] rounded-2xl p-0 sm:p-0">
          <div className="space-y-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>Adjust your profile picture</DialogTitle>
              <DialogDescription>Zoom and position the image, then apply.</DialogDescription>
            </DialogHeader>
            <div className="relative h-[320px] w-full">
              {rawImageUrl ? (
                <Cropper
                  image={rawImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, area) => setCroppedArea(area)}
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.currentTarget.value))} className="h-1 w-40 accent-primary" />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>Cancel</Button>
                <Button
                  type="button"
                  disabled={isUploadingAvatar}
                  aria-busy={isUploadingAvatar}
                  onClick={async () => {
                    if (!rawImageUrl || !croppedArea) return
                    setIsUploadingAvatar(true)
                    const toastId = toast.loading("Uploading photo...")
                    try {
                      const blob = await getCroppedBlob(rawImageUrl, croppedArea)
                      if (!blob) throw new Error("Failed to crop image")
                      if (blob.size > MAX_AVATAR_BYTES) {
                        toast.error("Cropped image is over 5 MB.")
                        return
                      }
                      const fd = new FormData()
                      fd.append("file", new File([blob], "avatar.png", { type: blob.type || "image/png" }))
                      const res = await fetch("/api/account/avatar", { method: "POST", body: fd })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || "Upload failed")
                      }
                      const { avatarUrl: url } = await res.json()
                      setAvatarUrl(url)
                      setDirty(true)
                      toast.success("Profile photo updated", { id: toastId })
                      router.refresh()
                      setCropOpen(false)
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Upload failed"
                      toast.error(msg, { id: toastId })
                    } finally {
                      setIsUploadingAvatar(false)
                    }
                  }}
                >
                  {isUploadingAvatar ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden /> Applying…</span>
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to discard them or go back and save?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmClose(false)}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false)
                onOpenChange(false)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const STAGE_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "pilot", label: "Pilot" },
  { value: "early", label: "Early" },
  { value: "scaling", label: "Scaling" },
  { value: "established", label: "Established" },
]

function OrganizationStageSelect({
  id,
  value,
  onChange,
  ariaInvalid,
}: {
  id?: string
  value: string
  onChange: (val: string) => void
  ariaInvalid?: boolean
}) {
  const known = STAGE_OPTIONS.some((o) => o.value === value)
  const controlledValue = value ? value : undefined
  return (
    <Select value={controlledValue} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid}>
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent>
        {STAGE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        {!known && value ? (
          <SelectItem value={value}>{value}</SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

async function getCroppedBlob(
  imageSrc: string,
  area: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const size = Math.min(area.width, area.height)
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        size,
        size
      )
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}

function SideLink({ label, active, onClick, danger = false }: { label: string; active: boolean; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left text-sm px-2 py-1.5 rounded-md transition-colors",
        active ? "bg-accent text-accent-foreground" : danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent"
      )}
    >
      {label}
    </button>
  )
}
