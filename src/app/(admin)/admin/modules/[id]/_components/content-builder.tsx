"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type InteractionItem = { type: string; config?: Record<string, unknown> }
type ResourceItem = { label?: string; url?: string; storage_path?: string }
type HomeworkItem = { label?: string; instructions?: string; upload_required?: boolean }
type WithId<T> = T & { _id: string }

export function ContentBuilder({
  moduleId,
  initialTranscript,
  initialAdminNotes,
  initialInteractions,
  initialResources,
  initialHomework,
  onSave,
}: {
  moduleId: string
  initialTranscript: string
  initialAdminNotes: string
  initialInteractions: unknown[]
  initialResources: unknown[]
  initialHomework: unknown[]
  onSave: (fd: FormData) => Promise<void>
}) {
  const [pending, start] = useTransition()
  const [interactions, setInteractions] = useState<WithId<InteractionItem>[]>(() => normalizeArray<InteractionItem>(initialInteractions))
  const [resources, setResources] = useState<WithId<ResourceItem>[]>(() => normalizeArray<ResourceItem>(initialResources))
  const [homework, setHomework] = useState<WithId<HomeworkItem>[]>(() => normalizeArray<HomeworkItem>(initialHomework))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const [newType, setNewType] = useState<string>("prompt")
  const [cfg, setCfg] = useState<Record<string, string>>({ label: "", question: "", min: "1", max: "5", options: "" })

  const addInteraction = () => {
    const t = newType
    const c: Record<string, unknown> = {}
    if (t === 'prompt') c.label = cfg.label || 'Response'
    if (t === 'poll') { c.question = cfg.question || 'Rate'; c.scale_min = Number(cfg.min || '1'); c.scale_max = Number(cfg.max || '5') }
    if (t === 'quiz') { c.question = cfg.question || 'Choose one'; c.options = parseOptions(cfg.options) }
    if (t === 'activity') { c.label = cfg.label || 'Select'; c.options = parseOptions(cfg.options).map((x, i) => ({ label: x, value: String(i) })) }
    setInteractions((arr) => [...arr, { _id: newId(), type: t, config: c }])
    setCfg({ label: "", question: "", min: "1", max: "5", options: "" })
  }

  const addResource = (label: string, url: string) => {
    if (!label && !url) return
    setResources((arr) => [...arr, { _id: newId(), label, url }])
  }

  const addHomework = (label: string, instructions: string, uploadRequired: boolean) => {
    if (!label && !instructions) return
    setHomework((arr) => [...arr, { _id: newId(), label, instructions, upload_required: uploadRequired }])
  }

  const onDragEnd = <T extends { _id: string }>(arr: T[], setArr: (next: T[]) => void, e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = arr.findIndex((it) => it._id === active.id)
    const newIndex = arr.findIndex((it) => it._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setArr(arrayMove(arr, oldIndex, newIndex))
  }

  const onSubmit = () => {
    const fd = new FormData()
    fd.set('moduleId', moduleId)
    fd.set('transcript', initialTranscript || '')
    fd.set('adminNotes', initialAdminNotes || '')
    fd.set('interactions', JSON.stringify(interactions.map(stripId)))
    fd.set('resources', JSON.stringify(resources.map(stripId)))
    fd.set('homework', JSON.stringify(homework.map(stripId)))
    start(async () => { await onSave(fd) })
  }

  return (
    <div className="space-y-6">
      <Section title="Interactions">
        <DndList
          sensors={sensors}
          items={interactions}
          onDragEnd={(e) => onDragEnd(interactions, setInteractions, e)}
          onDelete={(i) => setInteractions((a) => a.filter((_, idx) => idx !== i))}
          render={(it: WithId<InteractionItem>) => (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium capitalize">{it.type}</span>
            {it.config?.label ? <> — {String(it.config.label)}</> : null}
            {it.config?.question ? <> — {String(it.config.question)}</> : null}
          </div>
        )}
        />
        <div className="rounded-md border p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="it-type">Type</Label>
              <select id="it-type" value={newType} onChange={(e) => setNewType(e.target.value)} className="flex h-9 rounded-md border bg-background px-2 text-sm">
                <option value="prompt">Prompt</option>
                <option value="poll">Poll (1–5)</option>
                <option value="quiz">Quiz</option>
                <option value="activity">Activity (multi)</option>
              </select>
            </div>
            {newType === 'poll' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Min</Label>
                  <Input value={cfg.min} onChange={(e) => setCfg({ ...cfg, min: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Max</Label>
                  <Input value={cfg.max} onChange={(e) => setCfg({ ...cfg, max: e.target.value })} />
                </div>
              </div>
            ) : null}
          </div>
          {newType === 'prompt' || newType === 'activity' ? (
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={cfg.label} onChange={(e) => setCfg({ ...cfg, label: e.target.value })} />
            </div>
          ) : null}
          {newType === 'poll' || newType === 'quiz' ? (
            <div className="space-y-1">
              <Label>Question</Label>
              <Input value={cfg.question} onChange={(e) => setCfg({ ...cfg, question: e.target.value })} />
            </div>
          ) : null}
          {newType === 'quiz' || newType === 'activity' ? (
            <div className="space-y-1">
              <Label>Options (comma separated)</Label>
              <Input value={cfg.options} onChange={(e) => setCfg({ ...cfg, options: e.target.value })} />
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" onClick={addInteraction} disabled={pending}>Add interaction</Button>
          </div>
        </div>
      </Section>

      <Section title="Resources">
        <DndList
          sensors={sensors}
          items={resources}
          onDragEnd={(e) => onDragEnd(resources, setResources, e)}
          onDelete={(i) => setResources((a) => a.filter((_, idx) => idx !== i))}
          render={(it: WithId<ResourceItem>) => (
          <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
            <span className="font-medium">{it.label || 'Resource'}</span> — {it.url}
            {it.storage_path ? (
              <button
                type="button"
                className="ml-2 text-[10px] text-rose-500 underline"
                onClick={async () => {
                  try {
                    await fetch(`/api/admin/modules/${moduleId}/resource?path=${encodeURIComponent(it.storage_path!)}`, { method: 'DELETE' })
                    setResources((arr) => arr.filter((r) => r._id !== it._id))
                  } catch {}
                }}
              >
                Delete file
              </button>
            ) : null}
          </div>
        )}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <AddResource onAdd={addResource} />
          <UploadResource moduleId={moduleId} onUploaded={(label, url, path) => setResources((arr) => [...arr, { _id: newId(), label, url, storage_path: path }])} onDeleteFile={async (path) => {
            await fetch(`/api/admin/modules/${moduleId}/resource?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
            setResources((arr) => arr.filter((r) => r.storage_path !== path))
          }} />
        </div>
      </Section>

      <Section title="Homework">
        <DndList
          sensors={sensors}
          items={homework}
          onDragEnd={(e) => onDragEnd(homework, setHomework, e)}
          onDelete={(i) => setHomework((a) => a.filter((_, idx) => idx !== i))}
          render={(it: WithId<HomeworkItem>) => (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{it.label || 'Item'}</span>{it.upload_required ? ' — upload required' : ''}
            {it.instructions ? (<div className="mt-1 whitespace-pre-wrap">{it.instructions}</div>) : null}
          </div>
        )}
        />
        <AddHomework onAdd={addHomework} />
      </Section>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={pending}>Save content</Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="text-sm font-semibold">{title}</div>
      {children}
    </div>
  )
}

function DndList<T extends { _id: string }>({ items, render, onDragEnd, onDelete, sensors }: { items: T[]; render: (item: T) => React.ReactNode; onDragEnd: (e: DragEndEvent) => void; onDelete: (index: number) => void; sensors: ReturnType<typeof useSensors> }) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.length === 0 ? <li className="text-xs text-muted-foreground">No items yet.</li> : null}
          {items.map((it, idx) => (
            <SortableRow key={it._id} id={it._id} onDelete={() => onDelete(idx)}>
              {render(it)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({ id, children, onDelete }: { id: string; children: React.ReactNode; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <li ref={setNodeRef} style={style} className="flex items-start justify-between gap-2 rounded-md border bg-card/60 p-2">
      <div className="flex-1">
        <button type="button" aria-label="Drag to reorder" className="mr-2 cursor-grab text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
        {children}
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={onDelete}>✕</Button>
      </div>
    </li>
  )
}

function AddResource({ onAdd }: { onAdd: (label: string, url: string) => void }) {
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { onAdd(label, url); setLabel(""); setUrl("") }}>Add resource</Button>
      </div>
    </div>
  )
}

function UploadResource({ moduleId, onUploaded, onDeleteFile }: { moduleId: string; onUploaded: (label: string, url: string, path: string) => void; onDeleteFile: (path: string) => Promise<void> }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const onSelect = (file: File | null) => {
    if (!file) return
    const fd = new FormData()
    fd.set('file', file)
    start(async () => {
      try {
        const res = await fetch(`/api/admin/modules/${moduleId}/resource`, { method: 'POST', body: fd })
        const json = await res.json().catch(() => ({}) as { url?: string; label?: string; path?: string })
        if (!res.ok) throw new Error(json?.error || 'Upload failed')
        onUploaded(String(json.label || file.name), String(json.url), String(json.path || ''))
        setError(null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      }
    })
  }
  return (
    <div className="rounded-md border p-3 space-y-2">
      <Label>Upload resource</Label>
      <input type="file" onChange={(e) => onSelect(e.currentTarget.files?.[0] ?? null)} disabled={pending} />
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      <p className="text-xs text-muted-foreground">Max 25 MB. Publicly accessible via URL.</p>
    </div>
  )
}

function AddHomework({ onAdd }: { onAdd: (label: string, instructions: string, uploadRequired: boolean) => void }) {
  const [label, setLabel] = useState("")
  const [instructions, setInstructions] = useState("")
  const [upload, setUpload] = useState(false)
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="space-y-1">
        <Label>Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="min-h-20" />
      </div>
      <div className="flex items-center justify-between rounded-md border p-2">
        <span className="text-xs">Upload required</span>
        <input type="checkbox" checked={upload} onChange={(e) => setUpload(e.target.checked)} />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { onAdd(label, instructions, upload); setLabel(""); setInstructions(""); setUpload(false) }}>Add homework</Button>
      </div>
    </div>
  )
}

function parseOptions(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

function newId() {
  try { return crypto.randomUUID() } catch { return String(Date.now()) + Math.random().toString(36).slice(2) }
}

function normalizeArray<T>(arr: unknown[]): WithId<T>[] {
  if (!Array.isArray(arr)) return []
  return (arr as T[]).map((item) => ({ ...(item as object), _id: newId() } as WithId<T>))
}

function stripId<T extends { _id: string }>(item: T): Omit<T, '_id'> {
  const { _id: _omit, ...rest } = item
  return rest as Omit<T, '_id'>
}
