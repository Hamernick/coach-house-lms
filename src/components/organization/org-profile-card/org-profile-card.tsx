"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react"
import { toast } from "@/lib/toast"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { useRouter } from "next/navigation"
import { updateOrganizationProfileAction } from "@/app/(dashboard)/my-organization/actions"

import type { OrgProfile, OrgProfileCardProps, OrgProfileErrors, OrgProgram, ProfileTab, SlugStatus } from "./types"
import { organizationProfileSchema } from "./validation"
import { OrgProfileHeader } from "./header"
import { CompanyTab } from "./tabs/company-tab"
import { ProgramsTab } from "./tabs/programs-tab"
import { PeopleTab } from "./tabs/people-tab"
import { SupportersTab } from "./tabs/supporters-tab"
import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { slugifyLocal } from "./utils"
import { RESERVED_SLUGS } from "./tabs/company-tab/constants"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const TABS: Array<{ value: ProfileTab; label: string; icon: typeof BuildingIcon }> = [
  { value: "company", label: "About", icon: BuildingIcon },
  { value: "programs", label: "Programs", icon: ClipboardListIcon },
  { value: "people", label: "People", icon: UsersIcon },
]

function normalizeCompanyProfile(source: OrgProfile): OrgProfile {
  return {
    name: source.name ?? "",
    description: source.description ?? "",
    tagline: source.tagline ?? "",
    ein: source.ein ?? "",
    formationStatus:
      source.formationStatus === "pre_501c3" || source.formationStatus === "in_progress" || source.formationStatus === "approved"
        ? source.formationStatus
        : "in_progress",
    rep: source.rep ?? "",
    email: source.email ?? "",
    phone: source.phone ?? "",
    address: source.address ?? "",
    addressStreet: source.addressStreet ?? "",
    addressCity: source.addressCity ?? "",
    addressState: source.addressState ?? "",
    addressPostal: source.addressPostal ?? "",
    addressCountry: source.addressCountry ?? "",
    logoUrl: source.logoUrl ?? "",
    headerUrl: source.headerUrl ?? "",
    publicUrl: source.publicUrl ?? "",
    twitter: source.twitter ?? "",
    facebook: source.facebook ?? "",
    linkedin: source.linkedin ?? "",
    instagram: source.instagram ?? "",
    youtube: source.youtube ?? "",
    tiktok: source.tiktok ?? "",
    newsletter: source.newsletter ?? "",
    github: source.github ?? "",
    vision: source.vision ?? "",
    mission: source.mission ?? "",
    need: source.need ?? "",
    values: source.values ?? "",
    programs: source.programs ?? "",
    reports: source.reports ?? "",
    boilerplate: source.boilerplate ?? "",
    brandPrimary: source.brandPrimary ?? "",
    brandColors: Array.isArray(source.brandColors) ? source.brandColors : [],
    publicSlug: source.publicSlug ?? "",
    isPublic: Boolean(source.isPublic ?? false),
  }
}

export function OrgProfileEditor({
  initial,
  people,
  programs = [],
  canEdit = true,
  initialTab,
  initialProgramId,
}: OrgProfileCardProps) {
  const normalizedInitial = useMemo(() => normalizeCompanyProfile(initial), [initial])
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<ProfileTab>(() => initialTab ?? "company")
  const [company, setCompany] = useState<OrgProfile>(() => normalizedInitial)
  const [savedCompany, setSavedCompany] = useState<OrgProfile>(() => normalizedInitial)
  const savedCompanyRef = useRef(savedCompany)
  const pendingNavigationRef = useRef<string | null>(null)
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)
  const [errors, setErrors] = useState<OrgProfileErrors>({})
  const [editProgram, setEditProgram] = useState<OrgProgram | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const hasUnsavedChanges = dirty
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(null)
  const didOpenProgramRef = useRef(false)

  useEffect(() => {
    savedCompanyRef.current = savedCompany
  }, [savedCompany])

  useEffect(() => {
    if (!initialProgramId || !canEdit || didOpenProgramRef.current) return
    const match = programs.find((program) => program.id === initialProgramId) ?? null
    if (!match) return
    setTab("programs")
    setEditProgram(match)
    setEditOpen(true)
    didOpenProgramRef.current = true
  }, [canEdit, initialProgramId, programs])

  const handleTabChange = useCallback((value: string) => {
    if (!TABS.some((tab) => tab.value === value)) return
    setTab(value as ProfileTab)
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("myorg.activeTab", value)
      }
    } catch {
      // ignore storage failures
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      if (initialTab && TABS.some((tab) => tab.value === initialTab)) {
        setTab(initialTab)
        window.localStorage.setItem("myorg.activeTab", initialTab)
        return
      }
      const stored = window.localStorage.getItem("myorg.activeTab") as ProfileTab | null
      if (stored && TABS.some((tab) => tab.value === stored)) {
        setTab(stored)
      }
    } catch {
      // ignore
    }
  }, [initialTab])

  useEffect(() => {
    if (!canEdit || typeof window === "undefined") return
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges, canEdit])

  useEffect(() => {
    if (!hasUnsavedChanges || typeof window === "undefined") return
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      event.preventDefault()
      event.stopPropagation()
      pendingNavigationRef.current = anchor.href
      setConfirmDiscardOpen(true)
    }
    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [hasUnsavedChanges])

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!canEdit) return
      const { name, value } = event.currentTarget
      setCompany((prev) => ({ ...prev, [name]: value }))
      setDirty(true)
      setErrors((prev) => ({ ...prev, [name]: "" }))
    },
    [canEdit],
  )

  const updateCompany = useCallback((updates: Partial<OrgProfile>) => {
    setCompany((prev) => ({ ...prev, ...updates }))
  }, [])

  const markDirty = useCallback(() => {
    if (!canEdit) return
    setDirty(true)
  }, [canEdit])

  const discardChanges = useCallback(() => {
    setCompany(savedCompanyRef.current)
    setErrors({})
    setDirty(false)
    setEditMode(false)
    setSlugStatus(null)
  }, [])

  const persistProfileUpdates = useCallback(async (updates: Partial<OrgProfile>) => {
    const keys = Object.keys(updates) as Array<keyof OrgProfile>
    if (keys.length === 0) return

    setCompany((prev) => {
      const next: OrgProfile = { ...prev }
      const mutable = next as Record<keyof OrgProfile, OrgProfile[keyof OrgProfile]>
      for (const key of keys) {
        const value = updates[key]
        if (typeof value === "boolean") {
          mutable[key] = value
        } else if (Array.isArray(value)) {
          mutable[key] = value
        } else {
          mutable[key] = (value ?? "") as OrgProfile[typeof key]
        }
      }
      return next
    })

    const res = await updateOrganizationProfileAction(updates)
    const error = (res as { error?: string })?.error
    if (error) {
      const previous = savedCompanyRef.current
      setCompany((prev) => {
        const next: OrgProfile = { ...prev }
        const mutable = next as Record<keyof OrgProfile, OrgProfile[keyof OrgProfile]>
        for (const key of keys) {
          const value = previous[key]
          if (typeof value === "boolean") {
            mutable[key] = value
          } else if (Array.isArray(value)) {
            mutable[key] = value
          } else {
            mutable[key] = (value ?? "") as OrgProfile[typeof key]
          }
        }
        return next
      })
      throw new Error(error)
    }

    setSavedCompany((prev) => ({ ...prev, ...updates }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of keys) {
        next[key] = ""
      }
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!canEdit) return
    startTransition(async () => {
      const parsed = organizationProfileSchema.safeParse(company)
      if (!parsed.success) {
        const fieldErrors: OrgProfileErrors = {}
        Object.entries(parsed.error.flatten().fieldErrors).forEach(([key, value]) => {
          if (value && value.length > 0) fieldErrors[key] = value[0] as string
        })
        setErrors(fieldErrors)
        toast.error("Please fix the highlighted fields")
        return
      }

      const hasExplicitSlug = typeof company.publicSlug === "string" && company.publicSlug.trim().length > 0
      const shouldCheckSlug = hasExplicitSlug || Boolean(company.isPublic)
      if (shouldCheckSlug) {
        const base = hasExplicitSlug ? company.publicSlug ?? "" : company.name ?? ""
        const candidate = slugifyLocal(String(base))
        if (!candidate) {
          setSlugStatus({ available: false, message: "Enter a public URL", slug: "" })
          setErrors((prev) => ({ ...prev, publicSlug: "Enter a public URL" }))
          toast.error("Enter a public URL")
          return
        }
        if (RESERVED_SLUGS.has(candidate)) {
          setSlugStatus({ available: false, message: "Reserved URL", slug: candidate })
          setErrors((prev) => ({ ...prev, publicSlug: "This URL is reserved" }))
          toast.error("That public URL is reserved")
          return
        }
        if (slugStatus?.slug === candidate && slugStatus.available) {
          setErrors((prev) => ({ ...prev, publicSlug: "" }))
        }
        if (!(slugStatus?.slug === candidate && slugStatus.available)) {
          try {
            const res = await fetch(`/api/public/organizations/slug-available?slug=${encodeURIComponent(candidate)}`)
            const data = await res.json().catch(() => ({}))
            if (typeof data.available === "boolean") {
              const message = data.available ? "Available" : data.error || "Taken"
              setSlugStatus({ available: data.available, message, slug: candidate })
              if (!data.available) {
                setErrors((prev) => ({ ...prev, publicSlug: data.error || "Public URL is taken" }))
                toast.error("Public URL is not available")
                return
              }
              setErrors((prev) => ({ ...prev, publicSlug: "" }))
            } else {
              setSlugStatus({ available: false, message: data.error || "Not available", slug: candidate })
              setErrors((prev) => ({ ...prev, publicSlug: data.error || "Public URL is not available" }))
              toast.error("Public URL is not available")
              return
            }
          } catch {
            setSlugStatus({ available: false, message: "Unable to check", slug: candidate })
            setErrors((prev) => ({ ...prev, publicSlug: "Unable to verify public URL" }))
            toast.error("Unable to verify public URL")
            return
          }
        }
      }

      const res = await updateOrganizationProfileAction(company)
      if ((res as { error?: string })?.error) {
        toast.error((res as { error?: string }).error as string)
        return
      }
      toast.success("Organization updated")
      setEditMode(false)
      setDirty(false)
      setSavedCompany(company)
    })
  }, [company, canEdit, slugStatus])

  const handleProgramEdit = useCallback((program: OrgProgram) => {
    if (!canEdit) return
    setEditProgram(program)
    setEditOpen(true)
  }, [canEdit])

  const handleCancelEdit = useCallback(() => {
    if (!hasUnsavedChanges) {
      discardChanges()
      return
    }
    pendingNavigationRef.current = null
    setConfirmDiscardOpen(true)
  }, [hasUnsavedChanges, discardChanges])

  const handleDiscardConfirm = useCallback(() => {
    const nextUrl = pendingNavigationRef.current
    pendingNavigationRef.current = null
    discardChanges()
    if (nextUrl && typeof window !== "undefined") {
      const targetUrl = new URL(nextUrl, window.location.href)
      if (targetUrl.origin === window.location.origin) {
        router.push(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`)
      } else {
        window.location.href = nextUrl
      }
    }
  }, [discardChanges, router])

  const currentTabLabel = useMemo(() => TABS.find((t) => t.value === tab)?.label ?? "About", [tab])
  const publicLink = canEdit && company.isPublic && company.publicSlug ? `/${company.publicSlug}` : null

  const tabsIdBase = "org-profile-tabs"

  return (
    <Card className="overflow-hidden bg-sidebar py-0 pb-6">
      <OrgProfileHeader
        name={company.name || "Organization"}
        tagline={company.tagline || "—"}
        logoUrl={company.logoUrl ?? ""}
        headerUrl={company.headerUrl ?? ""}
        editMode={editMode}
        isSaving={isPending}
        isDirty={dirty}
        canEdit={canEdit}
        publicLink={publicLink}
        onLogoChange={(url) => persistProfileUpdates({ logoUrl: url })}
        onHeaderChange={(url) => persistProfileUpdates({ headerUrl: url })}
        onEnterEdit={() => canEdit && setEditMode(true)}
        onCancelEdit={handleCancelEdit}
        onSave={handleSave}
      />

      <CardContent className="bg-sidebar p-0">
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList
            data-tour="org-profile-tabs"
            className="hidden h-10 w-full items-end justify-start gap-3 rounded-none border-b bg-transparent p-0 pl-6 pr-6 text-muted-foreground sm:inline-flex"
          >
            {TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                id={`${tabsIdBase}-trigger-${item.value}`}
                aria-controls={`${tabsIdBase}-content-${item.value}`}
                className="relative -mb-[1px] inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-0 bg-transparent px-2 pb-2 pt-1 text-sm font-medium text-muted-foreground shadow-none transition-all duration-200 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:border-b-[2px] data-[state=active]:border-b-primary data-[state=active]:border-solid data-[state=active]:font-semibold data-[state=active]:text-foreground dark:data-[state=active]:!bg-transparent"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-end gap-2 border-b pl-6 pr-6 sm:hidden">
            <div className="inline-flex h-10 items-end whitespace-nowrap pb-2 pt-1 text-sm font-semibold text-foreground" aria-live="polite">
              <span className="-mb-px border-b-2 border-b-primary pb-[2px] transition-all duration-200">{currentTabLabel}</span>
            </div>
            <div className="ml-auto pb-1">
              <Select value={tab} onValueChange={handleTabChange}>
                <SelectTrigger data-tour="org-profile-tab-picker" className="h-9 min-w-[160px] bg-muted/60 text-sm font-medium">
                  <SelectValue aria-label="Select section" placeholder={currentTabLabel} />
                </SelectTrigger>
                <SelectContent align="end">
                  {TABS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {item.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent
            value="company"
            id={`${tabsIdBase}-content-company`}
            aria-labelledby={`${tabsIdBase}-trigger-company`}
            className="grid gap-8 p-6"
          >
            <CompanyTab
              company={company}
              errors={errors}
              editMode={editMode}
              onInputChange={handleInputChange}
              onUpdate={(updates) => {
                updateCompany(updates)
                setErrors((prev) => {
                  const next = { ...prev }
                  Object.keys(updates).forEach((key) => {
                    next[key] = ""
                  })
                  return next
                })
              }}
              onDirty={markDirty}
              onAutoSave={persistProfileUpdates}
              slugStatus={slugStatus}
              setSlugStatus={setSlugStatus}
            />
          </TabsContent>

          <TabsContent
            value="programs"
            id={`${tabsIdBase}-content-programs`}
            aria-labelledby={`${tabsIdBase}-trigger-programs`}
            className="grid gap-8 p-6"
          >
            <ProgramsTab
              programs={programs as OrgProgram[]}
              companyName={company.name}
              editMode={editMode}
              onProgramEdit={handleProgramEdit}
            />
          </TabsContent>

          <TabsContent
            value="people"
            id={`${tabsIdBase}-content-people`}
            aria-labelledby={`${tabsIdBase}-trigger-people`}
            className="grid gap-8 p-6"
          >
            <PeopleTab editMode={editMode} people={people} />
          </TabsContent>

          <TabsContent
            value="supporters"
            id={`${tabsIdBase}-content-supporters`}
            aria-labelledby={`${tabsIdBase}-trigger-supporters`}
            className="grid gap-8 p-6"
          >
            <SupportersTab editMode={editMode} people={people} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Discard them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                pendingNavigationRef.current = null
                setConfirmDiscardOpen(false)
              }}
            >
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscardOpen(false)
                handleDiscardConfirm()
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canEdit && editProgram ? (
        <ProgramWizardLazy mode="edit" program={editProgram} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </Card>
  )
}

export { OrgProfileEditor as OrgProfileCard }
