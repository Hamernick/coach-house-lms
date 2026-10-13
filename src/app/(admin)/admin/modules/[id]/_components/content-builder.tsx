"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Section } from "@/components/admin/module-builder/Section"
import { DndList } from "@/components/admin/module-builder/DndList"
import { AddResource } from "@/components/admin/module-builder/AddResource"
import { UploadResource } from "@/components/admin/module-builder/UploadResource"
import { AddHomework } from "@/components/admin/module-builder/AddHomework"
import { parseOptions } from "@/lib/text/options"
import { makeId } from "@/lib/id"

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
    if (t === 'quiz') { c.question = cfg.question || 'Choose one'; c.options = parseOptions(cfg.options, 'comma') }
    if (t === 'activity') { c.label = cfg.label || 'Select'; c.options = parseOptions(cfg.options, 'comma').map((x, i) => ({ label: x, value: String(i) })) }
    setInteractions((arr) => [...arr, { _id: makeId(), type: t, config: c }])
    setCfg({ label: "", question: "", min: "1", max: "5", options: "" })
  }

  const addResource = (label: string, url: string) => {
    if (!label && !url) return
    setResources((arr) => [...arr, { _id: makeId(), label, url }])
  }

  const addHomework = (label: string, instructions: string, uploadRequired: boolean) => {
    if (!label && !instructions) return
    setHomework((arr) => [...arr, { _id: makeId(), label, instructions, upload_required: uploadRequired }])
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
          <select
            id="it-type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="flex h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm"
          >
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
          <UploadResource
            moduleId={moduleId}
            onUploaded={(label, url, path) =>
              setResources((arr) => [...arr, { _id: makeId(), label, url, storage_path: path }])
            }
          />
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

function normalizeArray<T>(arr: unknown[]): WithId<T>[] {
  if (!Array.isArray(arr)) return []
  return (arr as T[]).map((item) => ({ ...(item as object), _id: makeId() } as WithId<T>))
}

function stripId<T extends { _id: string }>(item: T): Omit<T, '_id'> {
  const { _id, ...rest } = item
  void _id
  return rest as Omit<T, '_id'>
}
