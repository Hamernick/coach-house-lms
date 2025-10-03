"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ClassWizardDialog({ onCreate }: { onCreate: (fd: FormData) => Promise<{ id?: string; error?: string }> }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [pending, start] = useTransition()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [published, setPublished] = useState(false)
  const [sessionNumber, setSessionNumber] = useState<string>("")
  const [initialModules, setInitialModules] = useState<string>("2")
  const [error, setError] = useState<string | null>(null)

  const canNext1 = title.trim().length > 0 && slug.trim().length > 0
  const canNext2 = true

  const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">New session</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a new class</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[160px_1fr] gap-4">
          <Sidebar step={step} />
          <div className="space-y-4">
            {step === 1 ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cw-title">Title</Label>
                  <Input id="cw-title" value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(toSlug(e.target.value)) }} placeholder="Session title" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cw-slug">Slug</Label>
                  <Input id="cw-slug" value={slug} onChange={(e) => setSlug(toSlug(e.target.value))} placeholder="session-slug" />
                </div>
              </div>
            ) : null}
            {step === 2 ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cw-description">Description</Label>
                  <Textarea id="cw-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this class covers" />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-xs text-muted-foreground">Draft classes remain hidden to students</p>
                  </div>
                  <Switch checked={published} onCheckedChange={setPublished} />
                </div>
              </div>
            ) : null}
            {step === 3 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cw-session-number">Session number</Label>
                    <Input id="cw-session-number" type="number" min={1} value={sessionNumber} onChange={(e) => setSessionNumber(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cw-init-mods">Initial modules</Label>
                    <Input id="cw-init-mods" type="number" min={0} max={10} value={initialModules} onChange={(e) => setInitialModules(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">You can add and reorder modules later.</p>
              </div>
            ) : null}
            {error ? <p className="text-xs text-rose-500">{error}</p> : null}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
              <div className="flex items-center gap-2">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)} disabled={pending}>Back</Button>
                ) : null}
                {step < 3 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={pending || (step === 1 && !canNext1) || (step === 2 && !canNext2)}>Next</Button>
                ) : (
                  <Button onClick={() => {
                    const fd = new FormData()
                    fd.set('title', title)
                    fd.set('slug', slug)
                    fd.set('description', description)
                    fd.set('published', published ? 'true' : 'false')
                    if (sessionNumber) fd.set('sessionNumber', sessionNumber)
                    if (initialModules) fd.set('initialModules', initialModules)
                    start(async () => {
                      const res = await onCreate(fd)
                      if (res?.error) { setError(res.error); return }
                      setOpen(false)
                      window.location.href = `/admin/classes/${res?.id}`
                    })
                  }} disabled={pending || !title || !slug}>
                    {pending ? 'Creating…' : 'Create'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Sidebar({ step }: { step: number }) {
  const items = [
    { n: 1, label: 'Basics' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Options' },
  ]
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.n} className={cn("rounded-md border px-3 py-2 text-sm", step === it.n ? 'border-primary bg-primary/5 font-medium' : 'opacity-80')}>{it.n}. {it.label}</div>
      ))}
    </div>
  )
}
