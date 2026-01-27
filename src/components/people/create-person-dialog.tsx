"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldControl, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import { upsertPersonAction, type OrgPerson } from "@/actions/people"
import { toast } from "@/lib/toast"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ManagerSelect } from "@/components/people/manager-select"
import { PERSON_CATEGORY_META, PERSON_CATEGORY_OPTIONS } from "@/lib/people/categories"

type Props = {
  triggerClassName?: string
  initial?: Partial<OrgPerson>
  onSaved?: (id: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  people?: OrgPerson[]
}

export function CreatePersonDialog({ triggerClassName, initial, onSaved, open: controlledOpen, onOpenChange, people = [] }: Props) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(v)
    onOpenChange?.(v)
  }
  const [step, setStep] = React.useState(1)
  const [pending, startTransition] = useTransition()
  const [name, setName] = React.useState(initial?.name ?? "")
  const [title, setTitle] = React.useState(initial?.title ?? "")
  const [email, setEmail] = React.useState(initial?.email ?? "")
  const [linkedin, setLinkedin] = React.useState(initial?.linkedin ?? "")
  const [category, setCategory] = React.useState<OrgPerson["category"]>(initial?.category ?? "staff")
  const [image, setImage] = React.useState<string | null>(initial?.image ?? null)
  const [reportsToId, setReportsToId] = React.useState<string | null>(initial?.reportsToId ?? null)
  const linkedInHref = linkedin.trim()
    ? (linkedin.startsWith("http") ? linkedin : `https://www.linkedin.com/in/${linkedin.replace(/^\//, "")}`)
    : ""
  const steps = [
    {
      id: 1,
      title: "Category",
      description: "Choose where this person appears across your org profile and lists.",
    },
    {
      id: 2,
      title: "Details",
      description: "Add their name, title, and reporting line.",
    },
    {
      id: 3,
      title: "Profile",
      description: "Upload a photo and optional contact details.",
    },
  ] as const
  const currentStep = steps[step - 1] ?? steps[0]
  const canContinue = step === 1 ? Boolean(category) : step === 2 ? Boolean(name.trim()) : true
  const primaryLabel =
    step === steps.length
      ? initial?.id
        ? (pending ? "Saving…" : "Save Changes")
        : (pending ? "Adding…" : "Add Person")
      : "Continue"

  function reset() {
    setStep(1)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(f)
  }

  function onSubmit() {
    startTransition(async () => {
      const toastId = toast.loading(initial?.id ? "Saving changes…" : "Adding person…")
      const res = await upsertPersonAction({
        id: initial?.id,
        name,
        title,
        email,
        linkedin,
        category,
        image,
        reportsToId: (reportsToId || null) as string | null,
      })
      if (!('error' in res)) {
        setOpen(false)
        reset()
        onSaved?.(res.id)
        toast.success(initial?.id ? "Person updated" : "Person added", { id: toastId })
        router.refresh()
      } else {
        toast.error(res.error, { id: toastId })
      }
    })
  }

  function handlePrimary() {
    if (step < steps.length) {
      setStep((value) => Math.min(steps.length, value + 1))
      return
    }
    onSubmit()
  }

  function handleSecondary() {
    if (step === 1) {
      setOpen(false)
      return
    }
    setStep((value) => Math.max(1, value - 1))
  }

  return (
    <Sheet open={open} onOpenChange={(o)=>{ setOpen(o); if (!o) reset() }}>
      <SheetTrigger asChild>
        <Button data-tour="people-add" className={triggerClassName} size="sm">
          <PlusIcon className="size-4" />
          <span className="ml-2">Add</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b border-border/60 px-6 pb-4 pt-6 text-left">
          <SheetTitle>{initial?.id ? "Edit Person" : "Add Person"}</SheetTitle>
          <SheetDescription>Build a small profile for org chart and lists.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="mb-6 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {step} of {steps.length}</span>
              <span className="font-medium text-foreground">{currentStep.title}</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary"
                style={{ width: `${Math.round((step / steps.length) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{currentStep.description}</p>
          </div>

          {step === 1 && (
            <FieldGroup className="gap-4">
              <Field orientation="responsive">
                <FieldLabel>Category</FieldLabel>
                <FieldControl>
                  <Select
                    value={category}
                    onValueChange={(v)=>{ setCategory(v as OrgPerson["category"]); if (v !== 'staff') setReportsToId(null) }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {PERSON_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="mt-2">
                    This controls which section they show up in across the platform.
                  </FieldDescription>
                  <div className="mt-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 ${PERSON_CATEGORY_META[category].badgeClass}`}
                    >
                      <span className={`inline-block h-2 w-2 rounded-full ${PERSON_CATEGORY_META[category].dotClass}`} />
                      {PERSON_CATEGORY_META[category].label}
                    </span>
                  </div>
                </FieldControl>
              </Field>
            </FieldGroup>
          )}

          {step === 2 && (
            <FieldGroup className="gap-4">
              <Field orientation="responsive">
                <FieldLabel htmlFor="p-name">Name</FieldLabel>
                <FieldControl>
                  <Input id="p-name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" />
                </FieldControl>
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="p-title">Title</FieldLabel>
                <FieldControl>
                  <Input id="p-title" value={title ?? ""} onChange={(e)=>setTitle(e.target.value)} placeholder="Role or title" />
                </FieldControl>
              </Field>
              {category === 'staff' ? (
                <Field orientation="responsive">
                  <FieldLabel>Reports to</FieldLabel>
                  <FieldControl>
                    <ManagerSelect
                      value={reportsToId}
                      options={people.filter((p)=> p.category === 'staff' && (!initial?.id || p.id !== initial.id))}
                      onChange={(val)=> setReportsToId(val)}
                    />
                    <FieldDescription className="mt-2">Optional: set their reporting line.</FieldDescription>
                  </FieldControl>
                </Field>
              ) : null}
            </FieldGroup>
          )}

          {step === 3 && (
            <FieldGroup className="gap-5">
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-[96px,1fr] sm:items-center">
                  <Avatar className="size-20 sm:size-24">
                    <AvatarImage src={image ?? undefined} alt={name} />
                    <AvatarFallback>{name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="p-img" className="text-sm font-medium">Profile photo</Label>
                    <Input id="p-img" type="file" accept="image/*" onChange={handleFile} />
                    <FieldDescription>Square images work best.</FieldDescription>
                  </div>
                </div>
              </div>
              <Field orientation="responsive">
                <FieldLabel htmlFor="p-linkedin">LinkedIn</FieldLabel>
                <FieldControl>
                  <InputGroup>
                    <Input id="p-linkedin" value={linkedin ?? ""} onChange={(e)=>setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" />
                    <InputGroupAddon>
                      <InputGroupButton
                        type="button"
                        disabled={!linkedInHref}
                        onClick={()=>{ if (linkedInHref) window.open(linkedInHref, "_blank") }}
                      >
                        Open
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>If set, we’ll auto-fetch their photo on save.</FieldDescription>
                </FieldControl>
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="p-email">Email</FieldLabel>
                <FieldControl>
                  <Input id="p-email" value={email ?? ""} onChange={(e)=>setEmail(e.target.value)} placeholder="name@org.org" />
                  <FieldDescription>Used for contact cards (optional).</FieldDescription>
                </FieldControl>
              </Field>
            </FieldGroup>
          )}
        </div>
        <SheetFooter className="border-t border-border/60 bg-background/95 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={handleSecondary}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button onClick={handlePrimary} disabled={!canContinue || (step === steps.length && pending)} aria-busy={pending}>
            {primaryLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
