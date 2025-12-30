"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldControl, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import { upsertPersonAction, type OrgPerson } from "@/app/(dashboard)/people/actions"
import { toast } from "@/lib/toast"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ManagerSelect } from "@/components/people/manager-select"

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

  const CATEGORY_BADGE: Record<OrgPerson["category"], string> = {
    staff: "bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-500/30",
    board: "bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-500/30",
    supporter: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  }

  return (
    <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} size="sm">
          <PlusIcon className="size-4" />
          <span className="ml-2">Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Person" : "Add Person"}</DialogTitle>
          <DialogDescription>Build a small profile for org chart and lists.</DialogDescription>
        </DialogHeader>
        {/* Stepper */}
        <ol className="mb-2 flex items-center gap-2 text-xs">
          {[1, 2, 3].map((s) => (
            <li key={s} className={`inline-flex h-6 items-center rounded-full border px-2 ${step === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Step {s}</li>
          ))}
        </ol>

        {step === 1 && (
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel>Category</FieldLabel>
              <FieldControl>
                <Select
                  value={category}
                  onValueChange={(v)=>{ setCategory(v as OrgPerson["category"]); if (v !== 'staff') setReportsToId(null) }}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="board">Board</SelectItem>
                    <SelectItem value="supporter">Supporters</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 text-xs">
                  <span className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 ${CATEGORY_BADGE[category]}`}>
                    <span className={`inline-block h-2 w-2 rounded-full ${category==='staff'?'bg-sky-500':category==='board'?'bg-violet-500':'bg-emerald-500'}`} />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </div>
              </FieldControl>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={()=>setStep(2)} disabled={!category}>Continue</Button>
            </div>
          </FieldGroup>
        )}

        {step === 2 && (
          <FieldGroup>
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
                </FieldControl>
              </Field>
            ) : null}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={()=>setStep(1)}>Back</Button>
              <Button onClick={()=>setStep(3)} disabled={!name.trim()}>Continue</Button>
            </div>
          </FieldGroup>
        )}

        {step === 3 && (
          <FieldGroup>
            <Field>
              <FieldLabel>Profile picture</FieldLabel>
              <FieldControl>
                <div className="flex flex-col items-center gap-3 py-1">
                  <Avatar className="size-20">
                    <AvatarImage src={image ?? undefined} alt={name} />
                    <AvatarFallback>{name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <Label htmlFor="p-img" className="sr-only">Upload</Label>
                    <Input id="p-img" type="file" accept="image/*" onChange={handleFile} />
                    <FieldDescription>Square images work best.</FieldDescription>
                  </div>
                </div>
              </FieldControl>
            </Field>
            <div className="my-2"><div className="h-px w-full bg-border" /></div>
            <Field orientation="responsive">
              <FieldLabel htmlFor="p-linkedin">LinkedIn</FieldLabel>
              <FieldControl>
                <InputGroup>
                  <Input id="p-linkedin" value={linkedin ?? ""} onChange={(e)=>setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" />
                  <InputGroupAddon>
                    <InputGroupButton type="button" onClick={()=>window.open(linkedin || "https://linkedin.com", "_blank")}>Open</InputGroupButton>
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
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={()=>setStep(2)}>Back</Button>
              <Button onClick={onSubmit} disabled={pending} aria-busy={pending}>{initial?.id ? (pending ? "Saving…" : "Save Changes") : (pending ? "Adding…" : "Add Person")}</Button>
            </div>
          </FieldGroup>
        )}
      </DialogContent>
    </Dialog>
  )
}
