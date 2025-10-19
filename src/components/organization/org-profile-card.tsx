"use client"

import { Children, useEffect, useState, useTransition, type ChangeEvent, type ReactNode } from "react"
import { toast } from "sonner"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Field as FieldRow,
  FieldDescription as FieldHelperText,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { PeopleShowcase, SupportersShowcase, type OrgPersonWithImage } from "@/components/people/supporters-showcase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

import { updateOrganizationProfileAction } from "@/app/(dashboard)/my-organization/actions"
import { z } from "zod"
import { Loader2, ChevronDown } from "lucide-react"

type OrgProfile = {
  name?: string | null
  description?: string | null
  tagline?: string | null
  ein?: string | null
  rep?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressPostal?: string | null
  addressCountry?: string | null
  logoUrl?: string | null
  publicUrl?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  vision?: string | null
  mission?: string | null
  need?: string | null
  values?: string | null
  programs?: string | null
  reports?: string | null
}

export function OrgProfileCard({ initial, people }: { initial: OrgProfile; people: OrgPersonWithImage[] }) {
  const [editMode, setEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<string>("company")
  const tabs = [
    { value: "company", label: "About" },
    { value: "branding", label: "Branding" },
    { value: "people", label: "People" },
    { value: "programs", label: "Programs" },
    { value: "reports", label: "Reports" },
    { value: "supporters", label: "Supporters" },
  ]
  const [company, setCompany] = useState<OrgProfile>({
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
    publicUrl: initial.publicUrl ?? "",
    twitter: initial.twitter ?? "",
    facebook: initial.facebook ?? "",
    linkedin: initial.linkedin ?? "",
    vision: initial.vision ?? "",
    mission: initial.mission ?? "",
    need: initial.need ?? "",
    values: initial.values ?? "",
    programs: initial.programs ?? "",
    reports: initial.reports ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const Schema = z.object({
    name: z.string().min(1, "Name is required").max(120),
    tagline: z.string().max(160).optional().or(z.literal("")),
    description: z.string().max(5000).optional().or(z.literal("")),
    ein: z
      .string()
      .regex(/^[0-9]{2}-?[0-9]{7}$/i, "EIN must be 9 digits (e.g., 12-3456789)")
      .optional()
      .or(z.literal("")),
    rep: z.string().max(120).optional().or(z.literal("")),
    email: z.string().email("Must be a valid email").optional().or(z.literal("")),
    phone: z.string().max(60).optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
    addressStreet: z.string().max(400).optional().or(z.literal("")),
    addressCity: z.string().max(200).optional().or(z.literal("")),
    addressState: z.string().max(200).optional().or(z.literal("")),
    addressPostal: z.string().max(40).optional().or(z.literal("")),
    addressCountry: z.string().max(120).optional().or(z.literal("")),
    logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    publicUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    twitter: z.string().max(200).optional().or(z.literal("")),
    facebook: z.string().max(200).optional().or(z.literal("")),
    linkedin: z.string().max(200).optional().or(z.literal("")),
    vision: z.string().max(5000).optional().or(z.literal("")),
    mission: z.string().max(5000).optional().or(z.literal("")),
    need: z.string().max(5000).optional().or(z.literal("")),
    values: z.string().max(5000).optional().or(z.literal("")),
    programs: z.string().max(5000).optional().or(z.literal("")),
    reports: z.string().max(5000).optional().or(z.literal("")),
  })

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.currentTarget
    setCompany((prev) => ({ ...prev, [name]: value }))
    setDirty(true)
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  function handleSave() {
    startTransition(async () => {
      // Validate
      const parsed = Schema.safeParse(company)
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        Object.entries(parsed.error.flatten().fieldErrors).forEach(([k, v]) => {
          if (v && v.length > 0) fieldErrors[k] = v[0] as string
        })
        setErrors(fieldErrors)
        toast.error("Please fix the highlighted fields")
        return
      }

      const res = await updateOrganizationProfileAction(company)
      if ((res as { error?: string })?.error) {
        toast.error(res.error as string)
        return
      }
      toast.success("Organization updated")
      setEditMode(false)
      setDirty(false)
    })
  }

  // Warn on navigation if dirty (client only)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const headerSquares: Array<[number, number]> = [
    [4, 4],
    [5, 1],
    [8, 2],
    [5, 3],
    [5, 5],
    [10, 10],
    [12, 15],
    [15, 10],
    [10, 15],
    [15, 10],
    [10, 15],
    [15, 10],
  ]

  const addressLines = buildAddressLines({
    street: company.addressStreet,
    city: company.addressCity,
    state: company.addressState,
    postal: company.addressPostal,
    country: company.addressCountry,
    fallback: company.address,
  })

  return (
    <Card className="overflow-hidden bg-card/60 py-0 pb-6">
      {/* Header cover */}
      <div className="relative h-36 w-full overflow-hidden rounded-b-xl border-b bg-background">
        <GridPattern
          squares={headerSquares}
          className="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-70 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)]"
        />
      </div>

      {/* Header with logo overlay and actions */}
      <div className="relative p-6">
        {/* Logo overlay + controls */}
        <div className="absolute -top-12 left-6 flex items-center gap-3">
          <div className="h-24 w-24 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">LOGO</div>
            )}
          </div>
          {editMode ? (
            <label className="inline-flex self-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.currentTarget.files?.[0]
                  if (!f) return
                  const fd = new FormData()
                  fd.append("file", f)
                  setIsUploadingLogo(true)
                  const toastId = toast.loading("Uploading image…")
                  try {
                    const res = await fetch(`/api/account/org-media?kind=logo`, { method: "POST", body: fd })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err?.error || "Upload failed")
                    }
                    const { url } = await res.json()
                    setCompany((p) => ({ ...p, logoUrl: url }))
                    setDirty(true)
                    toast.success("Image uploaded", { id: toastId })
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId })
                  } finally {
                    setIsUploadingLogo(false)
                  }
                }}
              />
              <Button size="sm" variant="outline" disabled={isUploadingLogo}>
                {isUploadingLogo ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Image…
                  </span>
                ) : (
                  "Add image"
                )}
              </Button>
            </label>
          ) : null}
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">{company.name || "Organization"}</h2>
          <p className="text-sm text-muted-foreground">{company.tagline || "—"}</p>
        </div>

        <div className="absolute right-6 top-6 flex gap-2">
          {editMode ? (
            <>
              <Button variant="ghost" onClick={() => setEditMode(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Edit</Button>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          {/* Desktop tabs */}
          <TabsList className="hidden h-10 w-full items-end justify-start gap-3 rounded-none border-b bg-transparent p-0 pl-6 pr-6 text-muted-foreground sm:inline-flex">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="relative -mb-[1px] inline-flex h-10 items-end justify-center whitespace-nowrap rounded-none border-b-0 bg-transparent px-2 sm:px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground shadow-none transition-all duration-200 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:!bg-transparent dark:data-[state=active]:!bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border-b-[2px] data-[state=active]:border-b-primary data-[state=active]:border-solid"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile condensed header with More menu */}
          <div className="flex items-end gap-2 border-b pl-6 pr-6 sm:hidden">
            <div className="inline-flex h-10 items-end whitespace-nowrap pb-2 pt-1 text-sm font-semibold text-foreground" aria-live="polite">
              <span className="-mb-px border-b-2 border-b-primary pb-[2px] transition-all duration-200">
                {tabs.find((x) => x.value === tab)?.label}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="mb-1 inline-flex items-center gap-1">
                  More <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup value={tab} onValueChange={setTab}>
                  {tabs.map((t) => (
                    <DropdownMenuRadioItem key={t.value} value={t.value} className="cursor-pointer">
                      {t.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <TabsContent value="company" className="grid gap-8 p-6">
            <Section title="Company details">
              {editMode ? (
                <ProfileField label="Organization name">
                  <Input name="name" value={company.name ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.name)} />
                  {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
                </ProfileField>
              ) : null}
              {editMode ? (
                <ProfileField label="Tag line">
                  <Input name="tagline" value={company.tagline ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.tagline)} />
                  {errors.tagline ? <p className="text-xs text-destructive">{errors.tagline}</p> : null}
                </ProfileField>
              ) : null}
              <ProfileField label="Description">
                {editMode ? (
                  <Textarea name="description" value={company.description ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.description)} />
                ) : (
                  <FieldText text={company.description} multiline />
                )}
                {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
              </ProfileField>
              <ProfileField label="EIN">
                {editMode ? (
                  <Input name="ein" value={company.ein ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.ein)} />
                ) : (
                  <FieldText text={company.ein} />
                )}
                {errors.ein ? <p className="text-xs text-destructive">{errors.ein}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">Format: 12-3456789</p>
                ) : null}
              </ProfileField>
            </Section>

            <Section title="Contact">
              <ProfileField label="Representative">
                {editMode ? (
                  <Input name="rep" value={company.rep ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.rep)} />
                ) : (
                  <FieldText text={company.rep} />
                )}
                {errors.rep ? <p className="text-xs text-destructive">{errors.rep}</p> : null}
              </ProfileField>
              <ProfileField label="Email">
                {editMode ? (
                  <Input name="email" type="email" value={company.email ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.email)} />
                ) : (
                  <LinkText text={company.email} />
                )}
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </ProfileField>
              <ProfileField label="Phone">
                {editMode ? (
                  <Input name="phone" value={company.phone ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.phone)} />
                ) : (
                  <FieldText text={company.phone} />
                )}
                {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
              </ProfileField>
              {editMode ? (
                <FieldSet className="gap-4 rounded-lg border border-dashed p-4">
                  <FieldLegend>Organization address</FieldLegend>
                  <FieldHelperText>
                    Provide a mailing address for invoices and communications.
                  </FieldHelperText>
                  <FieldGroup className="gap-4">
                    <FieldRow>
                      <FieldLabel htmlFor="addressStreet">Street address</FieldLabel>
                      <Input
                        id="addressStreet"
                        name="addressStreet"
                        value={company.addressStreet ?? ""}
                        onChange={handleChange}
                        placeholder="123 Main St"
                      />
                    </FieldRow>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldRow>
                        <FieldLabel htmlFor="addressCity">City</FieldLabel>
                        <Input
                          id="addressCity"
                          name="addressCity"
                          value={company.addressCity ?? ""}
                          onChange={handleChange}
                          placeholder="New York"
                        />
                      </FieldRow>
                      <FieldRow>
                        <FieldLabel htmlFor="addressState">State / Region</FieldLabel>
                        <Input
                          id="addressState"
                          name="addressState"
                          value={company.addressState ?? ""}
                          onChange={handleChange}
                          placeholder="NY"
                        />
                      </FieldRow>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldRow>
                        <FieldLabel htmlFor="addressPostal">Postal code</FieldLabel>
                        <Input
                          id="addressPostal"
                          name="addressPostal"
                          value={company.addressPostal ?? ""}
                          onChange={handleChange}
                          placeholder="10001"
                        />
                      </FieldRow>
                      <FieldRow>
                        <FieldLabel htmlFor="addressCountry">Country</FieldLabel>
                        <Input
                          id="addressCountry"
                          name="addressCountry"
                          value={company.addressCountry ?? ""}
                          onChange={handleChange}
                          placeholder="United States"
                        />
                      </FieldRow>
                    </div>
                  </FieldGroup>
                </FieldSet>
              ) : addressLines.length > 0 ? (
                <ProfileField label="Address">
                  <AddressDisplay lines={addressLines} />
                </ProfileField>
              ) : null}
            </Section>

            <Section title="Story & impact">
              <ProfileField label="Vision">
                {editMode ? (
                  <Textarea name="vision" value={company.vision ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.vision)} />
                ) : (
                  <FieldText text={company.vision} multiline />
                )}
                {errors.vision ? <p className="text-xs text-destructive">{errors.vision}</p> : null}
              </ProfileField>
              <ProfileField label="Need statement">
                {editMode ? (
                  <Textarea name="need" value={company.need ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.need)} />
                ) : (
                  <FieldText text={company.need} multiline />
                )}
                {errors.need ? <p className="text-xs text-destructive">{errors.need}</p> : null}
              </ProfileField>
              <ProfileField label="Mission">
                {editMode ? (
                  <Textarea name="mission" value={company.mission ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.mission)} />
                ) : (
                  <FieldText text={company.mission} multiline />
                )}
                {errors.mission ? <p className="text-xs text-destructive">{errors.mission}</p> : null}
              </ProfileField>
              <ProfileField label="Values">
                {editMode ? (
                  <Textarea name="values" value={company.values ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.values)} />
                ) : (
                  <TagList value={company.values} />
                )}
                {errors.values ? <p className="text-xs text-destructive">{errors.values}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">
                    Separate multiple values with commas (e.g., compassion, integrity, innovation).
                  </p>
                ) : null}
              </ProfileField>
            </Section>
          </TabsContent>

          <TabsContent value="branding" className="grid gap-8 p-6">
            <Section title="Branding & social">
              <ProfileField label="Public URL">
                {editMode ? (
                  <Input name="publicUrl" value={company.publicUrl ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.publicUrl)} />
                ) : (
                  <LinkText text={company.publicUrl} />
                )}
                {errors.publicUrl ? <p className="text-xs text-destructive">{errors.publicUrl}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">Include full URL with https://</p>
                ) : null}
              </ProfileField>
              <ProfileField label="Twitter">
                {editMode ? (
                  <Input name="twitter" value={company.twitter ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.twitter)} />
                ) : (
                  <LinkText text={company.twitter} />
                )}
                {errors.twitter ? <p className="text-xs text-destructive">{errors.twitter}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">URL (e.g., https://x.com/yourhandle)</p>
                ) : null}
              </ProfileField>
              <ProfileField label="Facebook">
                {editMode ? (
                  <Input name="facebook" value={company.facebook ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.facebook)} />
                ) : (
                  <LinkText text={company.facebook} />
                )}
                {errors.facebook ? <p className="text-xs text-destructive">{errors.facebook}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">URL (e.g., https://facebook.com/yourpage)</p>
                ) : null}
              </ProfileField>
              <ProfileField label="LinkedIn">
                {editMode ? (
                  <Input name="linkedin" value={company.linkedin ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.linkedin)} />
                ) : (
                  <LinkText text={company.linkedin} />
                )}
                {errors.linkedin ? <p className="text-xs text-destructive">{errors.linkedin}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">URL (e.g., https://linkedin.com/company/yourorg)</p>
                ) : null}
              </ProfileField>
              <ProfileField label="Logo URL">
                {editMode ? (
                  <Input name="logoUrl" value={company.logoUrl ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.logoUrl)} />
                ) : (
                  <FieldText text={company.logoUrl} />
                )}
                {errors.logoUrl ? <p className="text-xs text-destructive">{errors.logoUrl}</p> : null}
              </ProfileField>
            </Section>
          </TabsContent>

          <TabsContent value="people" className="grid gap-8 p-6">
            <PeopleSection editMode={editMode} people={people} />
          </TabsContent>

          <TabsContent value="programs" className="grid gap-8 p-6">
            <Section title="Programs">
              <ProfileField label="Programs">
                {editMode ? (
                  <Textarea name="programs" value={company.programs ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.programs)} />
                ) : (
                  <TagList value={company.programs} />
                )}
                {errors.programs ? <p className="text-xs text-destructive">{errors.programs}</p> : null}
              </ProfileField>
            </Section>
          </TabsContent>

          <TabsContent value="reports" className="grid gap-8 p-6">
            <Section title="Reports">
              <ProfileField label="Reports">
                {editMode ? (
                  <Textarea name="reports" value={company.reports ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.reports)} />
                ) : (
                  <FieldText text={company.reports} multiline />
                )}
                {errors.reports ? <p className="text-xs text-destructive">{errors.reports}</p> : null}
              </ProfileField>
            </Section>
          </TabsContent>

          <TabsContent value="supporters" className="grid gap-8 p-6">
            <SupportersSection editMode={editMode} people={people} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  const childArray = Children.toArray(children)
  if (childArray.length === 0) {
    return null
  }

  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function FieldText({ text, multiline = false }: { text?: string | null; multiline?: boolean }) {
  const hasValue = Boolean(text && text.trim().length > 0)
  if (multiline) {
    return hasValue ? <p className="whitespace-pre-wrap text-sm">{text}</p> : null
  }
  return hasValue ? <p className="text-sm">{text}</p> : null
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const childArray = Children.toArray(children).filter(Boolean)
  if (childArray.length === 0) return null

  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">{childArray}</div>
    </section>
  )
}

function PeopleSection({ editMode, people }: { editMode: boolean; people: OrgPersonWithImage[] }) {
  const staff = people.filter((p) => p.category === "staff")
  const board = people.filter((p) => p.category === "board")

  const renderGroup = (
    label: string,
    group: OrgPersonWithImage[],
    editMessage: string,
    viewMessage: string,
  ) => (
    <div className="space-y-2" key={label}>
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <PeopleShowcase
        people={group}
        allPeople={people}
        emptyMessage={editMode ? editMessage : viewMessage}
      />
    </div>
  )

  return (
    <section className="space-y-4" aria-label="People">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">People</h3>
        <Button asChild size="sm" variant="outline">
          <Link href="/people">Manage in People</Link>
        </Button>
      </div>
      <div className="space-y-4">
        {renderGroup("Staff", staff, "No staff yet. Add team members from the People page.", "Staff will appear after they are added in the People page.")}
        {renderGroup("Board", board, "No board members yet. Add them from the People page.", "Board members will appear after they are added in the People page.")}
      </div>
    </section>
  )
}

function SupportersSection({ editMode, people }: { editMode: boolean; people: OrgPersonWithImage[] }) {
  const supporters = people.filter((p) => p.category === "supporter")

  return (
    <section className="space-y-3" aria-label="Supporters">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Supporters</h3>
        <Button asChild size="sm" variant="outline">
          <Link href="/people">Manage in People</Link>
        </Button>
      </div>
      <SupportersShowcase
        supporters={supporters}
        allPeople={people}
        emptyMessage={editMode ? "No supporters yet. Add supporters from the People page." : "Supporters will appear here once they are added in the People page."}
      />
      {supporters.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Updates to supporters on the People page are reflected here automatically.
        </p>
      ) : null}
    </section>
  )
}

function TagList({ value }: { value?: string | null }) {
  const items = normalizeToList(value)
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => {
        const isUrl = /^https?:\/\//i.test(it)
        return isUrl ? (
          <a key={i} href={it} target="_blank" rel="noopener" className="rounded-md border bg-muted px-2 py-0.5 text-xs underline underline-offset-2">
            {shortUrl(it)}
          </a>
        ) : (
          <span key={i} className="rounded-md border bg-muted px-2 py-0.5 text-xs">{it}</span>
        )
      })}
    </div>
  )
}

function normalizeToList(value?: string | null): string[] {
  if (!value) return []
  const v = value.trim()
  if (v.length === 0) return []
  if (v.startsWith('[')) {
    try {
      const arr = JSON.parse(v)
      return Array.isArray(arr) ? arr.map((x) => String(x)) : []
    } catch { /* fallthrough */ }
  }
  // Fallback: comma-separated
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}

function LinkText({ text }: { text?: string | null }) {
  if (!text) return null
  const v = text.trim()
  if (!v) return null
  const isUrl = /^https?:\/\//i.test(v)
  return isUrl ? (
    <a href={v} target="_blank" rel="noopener" className="text-sm underline underline-offset-2">{shortUrl(v)}</a>
  ) : (
    <span className="text-sm">{v}</span>
  )
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    return host + u.pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}

function AddressDisplay({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-0.5 text-sm">
      {lines.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  )
}

function buildAddressLines({
  street,
  city,
  state,
  postal,
  country,
  fallback,
}: {
  street?: string | null
  city?: string | null
  state?: string | null
  postal?: string | null
  country?: string | null
  fallback?: string | null
}): string[] {
  const lines: string[] = []
  if (street && street.trim()) lines.push(street.trim())
  const locality = [city, state, postal].filter((part) => part && String(part).trim().length > 0).map((part) => String(part).trim())
  if (locality.length > 0) lines.push(locality.join(", "))
  if (country && country.trim()) lines.push(country.trim())

  if (lines.length === 0 && fallback && fallback.trim()) {
    fallback
      .split(/\n+/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => lines.push(segment))
  }

  return lines
}
