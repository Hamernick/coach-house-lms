"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
  entity?: string | null
  ein?: string | null
  incorporation?: string | null
  rep?: string | null
  phone?: string | null
  address?: string | null
  coverUrl?: string | null
  logoUrl?: string | null
  publicUrl?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  vision?: string | null
  mission?: string | null
  need?: string | null
  values?: string | null
  people?: string | null
  programs?: string | null
  reports?: string | null
  toolkit?: string | null
  supporters?: string | null
  readinessScore?: string | null
}

export function OrgProfileCard({ initial }: { initial: OrgProfile }) {
  const [editMode, setEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<string>("company")
  const tabs = [
    { value: "company", label: "Organization" },
    { value: "branding", label: "Branding" },
    { value: "about", label: "About" },
    { value: "people", label: "People" },
    { value: "programs", label: "Programs" },
    { value: "reports", label: "Reports" },
    { value: "toolkit", label: "Toolkit" },
    { value: "supporters", label: "Supporters" },
  ]
  const [company, setCompany] = useState<OrgProfile>({
    name: initial.name ?? "",
    entity: initial.entity ?? "",
    ein: initial.ein ?? "",
    incorporation: initial.incorporation ?? "",
    rep: initial.rep ?? "",
    phone: initial.phone ?? "",
    address: initial.address ?? "",
    coverUrl: initial.coverUrl ?? "",
    logoUrl: initial.logoUrl ?? "",
    publicUrl: initial.publicUrl ?? "",
    twitter: initial.twitter ?? "",
    facebook: initial.facebook ?? "",
    linkedin: initial.linkedin ?? "",
    vision: initial.vision ?? "",
    mission: initial.mission ?? "",
    need: initial.need ?? "",
    values: initial.values ?? "",
    people: initial.people ?? "",
    programs: initial.programs ?? "",
    reports: initial.reports ?? "",
    toolkit: initial.toolkit ?? "",
    supporters: initial.supporters ?? "",
    readinessScore: initial.readinessScore ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const Schema = z.object({
    name: z.string().min(1, "Name is required").max(120),
    entity: z.string().max(120).optional().or(z.literal("")),
    ein: z
      .string()
      .regex(/^[0-9]{2}-?[0-9]{7}$/i, "EIN must be 9 digits (e.g., 12-3456789)")
      .optional()
      .or(z.literal("")),
    incorporation: z.string().max(120).optional().or(z.literal("")),
    rep: z.string().max(120).optional().or(z.literal("")),
    phone: z.string().max(60).optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
    coverUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    publicUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    twitter: z.string().max(200).optional().or(z.literal("")),
    facebook: z.string().max(200).optional().or(z.literal("")),
    linkedin: z.string().max(200).optional().or(z.literal("")),
    vision: z.string().max(5000).optional().or(z.literal("")),
    mission: z.string().max(5000).optional().or(z.literal("")),
    need: z.string().max(5000).optional().or(z.literal("")),
    values: z.string().max(5000).optional().or(z.literal("")),
    people: z.string().max(5000).optional().or(z.literal("")),
    programs: z.string().max(5000).optional().or(z.literal("")),
    reports: z.string().max(5000).optional().or(z.literal("")),
    toolkit: z.string().max(5000).optional().or(z.literal("")),
    supporters: z.string().max(5000).optional().or(z.literal("")),
    readinessScore: z.string().optional().or(z.literal("")),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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

  return (
    <Card className="overflow-hidden bg-card/60 py-0 pb-6">
      {/* Header cover */}
      <div className="relative h-36 w-full bg-muted">
        {company.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.coverUrl} alt="Cover" className="block h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background" />
        )}

        {editMode ? (
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.currentTarget.files?.[0]
                  if (!f) return
                  const fd = new FormData()
                  fd.append("file", f)
                  setIsUploadingCover(true)
                  const toastId = toast.loading("Uploading cover…")
                  try {
                    const res = await fetch(`/api/account/org-media?kind=cover`, { method: "POST", body: fd })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err?.error || "Upload failed")
                    }
                    const { url } = await res.json()
                    setCompany((p) => ({ ...p, coverUrl: url }))
                    setDirty(true)
                    toast.success("Cover uploaded", { id: toastId })
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId })
                  } finally {
                    setIsUploadingCover(false)
                  }
                }}
              />
              <Button size="sm" variant="outline" disabled={isUploadingCover}>
                {isUploadingCover ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Cover…</span> : "Upload cover"}
              </Button>
            </label>
          </div>
        ) : null}
      </div>

      {/* Header with logo overlay and actions */}
      <div className="relative p-6">
        {/* Logo overlay */}
        <div className="absolute -top-12 left-6 h-24 w-24 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">LOGO</div>
          )}
          {editMode ? (
            <div className="absolute inset-x-0 bottom-0 flex justify-center bg-background/60 p-1">
              <label className="cursor-pointer">
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
                    const toastId = toast.loading("Uploading logo…")
                    try {
                      const res = await fetch(`/api/account/org-media?kind=logo`, { method: "POST", body: fd })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || "Upload failed")
                      }
                      const { url } = await res.json()
                      setCompany((p) => ({ ...p, logoUrl: url }))
                      setDirty(true)
                      toast.success("Logo uploaded", { id: toastId })
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId })
                    } finally {
                      setIsUploadingLogo(false)
                    }
                  }}
                />
                <Button size="sm" variant="outline" disabled={isUploadingLogo}>
                  {isUploadingLogo ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Logo…</span> : "Upload logo"}
                </Button>
              </label>
            </div>
          ) : null}
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">{company.name || "Organization"}</h2>
          <p className="text-sm text-muted-foreground">{company.entity || "—"}</p>
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
              <Field label="Organization name">
                {editMode ? (
                  <Input name="name" value={company.name ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.name)} />
                ) : (
                  <FieldText text={company.name} />
                )}
                {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
              </Field>
              <Field label="Entity type">
                {editMode ? (
                  <Input name="entity" value={company.entity ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.entity)} />
                ) : (
                  <FieldText text={company.entity} />
                )}
                {errors.entity ? <p className="text-xs text-destructive">{errors.entity}</p> : null}
              </Field>
              <Field label="EIN">
                {editMode ? (
                  <Input name="ein" value={company.ein ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.ein)} />
                ) : (
                  <FieldText text={company.ein} />
                )}
                {errors.ein ? <p className="text-xs text-destructive">{errors.ein}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">Format: 12-3456789</p>
                ) : null}
              </Field>
              <Field label="Readiness score (1–5)">
                {editMode ? (
                  <Input name="readinessScore" type="number" min={1} max={5} value={company.readinessScore ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.readinessScore)} />
                ) : (
                  <p className="text-sm">{company.readinessScore ? `${company.readinessScore}/5` : <span className="text-muted-foreground">—</span>}</p>
                )}
                {errors.readinessScore ? <p className="text-xs text-destructive">{errors.readinessScore}</p> : null}
              </Field>
              <Field label="Incorporation date">
                {editMode ? (
                  <Input name="incorporation" value={company.incorporation ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.incorporation)} />
                ) : (
                  <FieldText text={company.incorporation} />
                )}
                {errors.incorporation ? <p className="text-xs text-destructive">{errors.incorporation}</p> : null}
              </Field>
            </Section>

            <Section title="Contact">
              <Field label="Representative">
                {editMode ? (
                  <Input name="rep" value={company.rep ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.rep)} />
                ) : (
                  <FieldText text={company.rep} />
                )}
                {errors.rep ? <p className="text-xs text-destructive">{errors.rep}</p> : null}
              </Field>
              <Field label="Phone">
                {editMode ? (
                  <Input name="phone" value={company.phone ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.phone)} />
                ) : (
                  <FieldText text={company.phone} />
                )}
                {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
              </Field>
              <Field label="Address">
                {editMode ? (
                  <Textarea name="address" value={company.address ?? ""} onChange={handleChange} rows={2} aria-invalid={Boolean(errors.address)} />
                ) : (
                  <FieldText text={company.address} multiline />
                )}
                {errors.address ? <p className="text-xs text-destructive">{errors.address}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="branding" className="grid gap-8 p-6">
            <Section title="Branding & social">
              <Field label="Public URL">
                {editMode ? (
                  <Input name="publicUrl" value={company.publicUrl ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.publicUrl)} />
                ) : (
                  <LinkText text={company.publicUrl} />
                )}
                {errors.publicUrl ? <p className="text-xs text-destructive">{errors.publicUrl}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">Include full URL with https://</p>
                ) : null}
              </Field>
              <Field label="Twitter">
                {editMode ? (
                  <Input name="twitter" value={company.twitter ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.twitter)} />
                ) : (
                  <LinkText text={company.twitter} />
                )}
                {errors.twitter ? <p className="text-xs text-destructive">{errors.twitter}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">URL (e.g., https://x.com/yourhandle)</p>
                ) : null}
              </Field>
              <Field label="Facebook">
                {editMode ? (
                  <Input name="facebook" value={company.facebook ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.facebook)} />
                ) : (
                  <LinkText text={company.facebook} />
                )}
                {errors.facebook ? <p className="text-xs text-destructive">{errors.facebook}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">URL (e.g., https://facebook.com/yourpage)</p>
                ) : null}
              </Field>
              <Field label="LinkedIn">
                {editMode ? (
                  <Input name="linkedin" value={company.linkedin ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.linkedin)} />
                ) : (
                  <LinkText text={company.linkedin} />
                )}
                {errors.linkedin ? <p className="text-xs text-destructive">{errors.linkedin}</p> : null}
                {editMode ? (
                  <p className="text-xs text-muted-foreground">URL (e.g., https://linkedin.com/company/yourorg)</p>
                ) : null}
              </Field>
              <Field label="Logo URL">
                {editMode ? (
                  <Input name="logoUrl" value={company.logoUrl ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.logoUrl)} />
                ) : (
                  <FieldText text={company.logoUrl} />
                )}
                {errors.logoUrl ? <p className="text-xs text-destructive">{errors.logoUrl}</p> : null}
              </Field>
              <Field label="Cover URL">
                {editMode ? (
                  <Input name="coverUrl" value={company.coverUrl ?? ""} onChange={handleChange} aria-invalid={Boolean(errors.coverUrl)} />
                ) : (
                  <FieldText text={company.coverUrl} />
                )}
                {errors.coverUrl ? <p className="text-xs text-destructive">{errors.coverUrl}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="about" className="grid gap-8 p-6">
            <Section title="About">
              <Field label="Vision">
                {editMode ? (
                  <Textarea name="vision" value={company.vision ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.vision)} />
                ) : (
                  <FieldText text={company.vision} multiline />
                )}
                {errors.vision ? <p className="text-xs text-destructive">{errors.vision}</p> : null}
              </Field>
              <Field label="Need statement">
                {editMode ? (
                  <Textarea name="need" value={company.need ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.need)} />
                ) : (
                  <FieldText text={company.need} multiline />
                )}
                {errors.need ? <p className="text-xs text-destructive">{errors.need}</p> : null}
              </Field>
              <Field label="Mission">
                {editMode ? (
                  <Textarea name="mission" value={company.mission ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.mission)} />
                ) : (
                  <FieldText text={company.mission} multiline />
                )}
                {errors.mission ? <p className="text-xs text-destructive">{errors.mission}</p> : null}
              </Field>
              <Field label="Values">
                {editMode ? (
                  <Textarea name="values" value={company.values ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.values)} />
                ) : (
                  <TagList value={company.values} />
                )}
                {errors.values ? <p className="text-xs text-destructive">{errors.values}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="people" className="grid gap-8 p-6">
            <Section title="People">
              <Field label="People">
                {editMode ? (
                  <Textarea name="people" value={company.people ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.people)} />
                ) : (
                  <TagList value={company.people} />
                )}
                {errors.people ? <p className="text-xs text-destructive">{errors.people}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="programs" className="grid gap-8 p-6">
            <Section title="Programs">
              <Field label="Programs">
                {editMode ? (
                  <Textarea name="programs" value={company.programs ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.programs)} />
                ) : (
                  <TagList value={company.programs} />
                )}
                {errors.programs ? <p className="text-xs text-destructive">{errors.programs}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="reports" className="grid gap-8 p-6">
            <Section title="Reports">
              <Field label="Reports">
                {editMode ? (
                  <Textarea name="reports" value={company.reports ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.reports)} />
                ) : (
                  <FieldText text={company.reports} multiline />
                )}
                {errors.reports ? <p className="text-xs text-destructive">{errors.reports}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="toolkit" className="grid gap-8 p-6">
            <Section title="Toolkit">
              <Field label="Toolkit">
                {editMode ? (
                  <Textarea name="toolkit" value={company.toolkit ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.toolkit)} />
                ) : (
                  <FieldText text={company.toolkit} multiline />
                )}
                {errors.toolkit ? <p className="text-xs text-destructive">{errors.toolkit}</p> : null}
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="supporters" className="grid gap-8 p-6">
            <Section title="Supporters">
              <Field label="Supporters">
                {editMode ? (
                  <Textarea name="supporters" value={company.supporters ?? ""} onChange={handleChange} rows={3} aria-invalid={Boolean(errors.supporters)} />
                ) : (
                  <TagList value={company.supporters} />
                )}
                {errors.supporters ? <p className="text-xs text-destructive">{errors.supporters}</p> : null}
              </Field>
            </Section>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function FieldText({ text, multiline = false }: { text?: string | null; multiline?: boolean }) {
  if (multiline) {
    return <p className="whitespace-pre-wrap text-sm">{text || <span className="text-muted-foreground">—</span>}</p>
  }
  return <p className="text-sm">{text || <span className="text-muted-foreground">—</span>}</p>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  )
}

function TagList({ value }: { value?: string | null }) {
  const items = normalizeToList(value)
  if (items.length === 0) return <span className="text-muted-foreground">—</span>
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
  if (!text) return <span className="text-muted-foreground">—</span>
  const v = text.trim()
  if (!v) return <span className="text-muted-foreground">—</span>
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
