"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
} from "react"
import { toast } from "@/lib/toast"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { updateOrganizationProfileAction } from "@/app/(dashboard)/my-organization/actions"

import type { OrgProfile, OrgProfileCardProps, OrgProfileErrors, OrgProgram, ProfileTab } from "./types"
import { organizationProfileSchema } from "./validation"
import { OrgProfileHeader } from "./header"
import { CompanyTab } from "./tabs/company-tab"
import { ProgramsTab } from "./tabs/programs-tab"
import { PeopleTab } from "./tabs/people-tab"
import { SupportersTab } from "./tabs/supporters-tab"
import { DocumentsTab } from "./tabs/documents-tab"
import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import HeartHandshakeIcon from "lucide-react/dist/esm/icons/heart-handshake"
import UsersIcon from "lucide-react/dist/esm/icons/users"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import LockIcon from "lucide-react/dist/esm/icons/lock"

import { RoadmapShell } from "@/components/roadmap/roadmap-shell"

const TABS: Array<{ value: ProfileTab; label: string; icon: typeof BuildingIcon }> = [
  { value: "company", label: "About", icon: BuildingIcon },
  { value: "programs", label: "Programs", icon: ClipboardListIcon },
  { value: "people", label: "People", icon: UsersIcon },
  { value: "supporters", label: "Supporters", icon: HeartHandshakeIcon },
  { value: "roadmap", label: "Roadmap", icon: WaypointsIcon },
  { value: "documents", label: "Documents", icon: LockIcon },
]

export function OrgProfileEditor({
  initial,
  people,
  programs = [],
  documents,
  canEdit = true,
  roadmapSections,
  roadmapPublicSlug,
  roadmapIsPublic,
  roadmapHeroUrl,
  initialTab,
}: OrgProfileCardProps) {
  const [editMode, setEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<ProfileTab>(() => initialTab ?? "company")
  const [company, setCompany] = useState<OrgProfile>(() => ({
    name: initial.name ?? "",
    description: initial.description ?? "",
    tagline: initial.tagline ?? "",
    ein: initial.ein ?? "",
    rep: initial.rep ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? "",
    addressStreet: initial.addressStreet ?? "",
    addressCity: initial.addressCity ?? "",
    addressState: initial.addressState ?? "",
    addressPostal: initial.addressPostal ?? "",
    addressCountry: initial.addressCountry ?? "",
    logoUrl: initial.logoUrl ?? "",
    headerUrl: initial.headerUrl ?? "",
    publicUrl: initial.publicUrl ?? "",
    twitter: initial.twitter ?? "",
    facebook: initial.facebook ?? "",
    linkedin: initial.linkedin ?? "",
    instagram: initial.instagram ?? "",
    youtube: initial.youtube ?? "",
    tiktok: initial.tiktok ?? "",
    newsletter: initial.newsletter ?? "",
    github: initial.github ?? "",
    vision: initial.vision ?? "",
    mission: initial.mission ?? "",
    need: initial.need ?? "",
    values: initial.values ?? "",
    programs: initial.programs ?? "",
    reports: initial.reports ?? "",
    boilerplate: initial.boilerplate ?? "",
    brandPrimary: initial.brandPrimary ?? "",
    brandColors: Array.isArray(initial.brandColors) ? initial.brandColors : [],
    publicSlug: initial.publicSlug ?? "",
    isPublic: Boolean(initial.isPublic ?? false),
  }))
  const [errors, setErrors] = useState<OrgProfileErrors>({})
  const [editProgram, setEditProgram] = useState<OrgProgram | null>(null)
  const [editOpen, setEditOpen] = useState(false)

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
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty, canEdit])

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

      const res = await updateOrganizationProfileAction(company)
      if ((res as { error?: string })?.error) {
        toast.error((res as { error?: string }).error as string)
        return
      }
      toast.success("Organization updated")
      setEditMode(false)
      setDirty(false)
    })
  }, [company, canEdit])

  const handleProgramEdit = useCallback((program: OrgProgram) => {
    if (!canEdit) return
    setEditProgram(program)
    setEditOpen(true)
  }, [canEdit])

  const currentTabLabel = useMemo(() => TABS.find((t) => t.value === tab)?.label ?? "About", [tab])
  const publicLink = canEdit && company.isPublic && company.publicSlug ? `/${company.publicSlug}` : null

  const tabsIdBase = "org-profile-tabs"

  return (
    <Card className="overflow-hidden bg-card/60 py-0 pb-6">
        <OrgProfileHeader
          name={company.name || "Organization"}
          tagline={company.tagline || "—"}
          logoUrl={company.logoUrl ?? ""}
          headerUrl={company.headerUrl ?? ""}
          editMode={editMode}
          isSaving={isPending}
          canEdit={canEdit}
          publicLink={publicLink}
          onLogoChange={(url) => updateCompany({ logoUrl: url })}
          onHeaderChange={(url) => updateCompany({ headerUrl: url })}
          onSetDirty={markDirty}
          onEnterEdit={() => canEdit && setEditMode(true)}
          onCancelEdit={() => setEditMode(false)}
          onSave={handleSave}
        />

      <CardContent className="p-0">
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="hidden h-10 w-full items-end justify-start gap-3 rounded-none border-b bg-transparent p-0 pl-6 pr-6 text-muted-foreground sm:inline-flex">
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
                <SelectTrigger className="h-9 min-w-[160px] bg-muted/60 text-sm font-medium">
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

          <TabsContent
            value="roadmap"
            id={`${tabsIdBase}-content-roadmap`}
            aria-labelledby={`${tabsIdBase}-trigger-roadmap`}
            className="grid gap-8 p-6"
          >
            <RoadmapShell
              sections={roadmapSections}
              publicSlug={roadmapPublicSlug}
              initialPublic={roadmapIsPublic}
              heroUrl={roadmapHeroUrl ?? null}
            />
          </TabsContent>

          <TabsContent
            value="documents"
            id={`${tabsIdBase}-content-documents`}
            aria-labelledby={`${tabsIdBase}-trigger-documents`}
            className="grid gap-8 p-6"
          >
            <DocumentsTab documents={documents} editMode={editMode} canEdit={canEdit} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {canEdit && editProgram ? (
        <ProgramWizardLazy mode="edit" program={editProgram} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </Card>
  )
}

export { OrgProfileEditor as OrgProfileCard }
