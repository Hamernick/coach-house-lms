"use client"

import { useState, useTransition, type Dispatch, type SetStateAction } from "react"
import { type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseOptions } from "@/lib/text/options"
import { makeId } from "@/lib/id"
import { AddHomework, AddResource, DndList, Section, UploadResource } from "./module-builder"

type InteractionType = "prompt" | "poll" | "quiz" | "activity"
type InteractionDraft = {
  label: string
  question: string
  min: string
  max: string
  options: string
}

type InteractionItem = { type: InteractionType; config?: Record<string, unknown> }
type ResourceItem = { label?: string; url?: string; storage_path?: string }
type HomeworkItem = { label?: string; instructions?: string; upload_required?: boolean }
type WithId<T> = T & { _id: string }

function createDefaultInteractionDraft(): InteractionDraft {
  return { label: "", question: "", min: "1", max: "5", options: "" }
}

function buildInteractionConfig(type: InteractionType, draft: InteractionDraft): Record<string, unknown> {
  switch (type) {
    case "prompt":
      return { label: draft.label || "Response" }
    case "poll":
      return {
        question: draft.question || "Rate",
        scale_min: Number(draft.min || "1"),
        scale_max: Number(draft.max || "5"),
      }
    case "quiz":
      return {
        question: draft.question || "Choose one",
        options: parseOptions(draft.options, "comma"),
      }
    case "activity":
      return {
        label: draft.label || "Select",
        options: parseOptions(draft.options, "comma").map((label, index) => ({
          label,
          value: String(index),
        })),
      }
  }
}

function reorderItems<T extends { _id: string }>(items: T[], event: DragEndEvent): T[] {
  const { active, over } = event
  if (!over || active.id === over.id) return items

  const oldIndex = items.findIndex((item) => item._id === active.id)
  const newIndex = items.findIndex((item) => item._id === over.id)
  if (oldIndex === -1 || newIndex === -1) return items

  return arrayMove(items, oldIndex, newIndex)
}

function createDragEndHandler<T extends { _id: string }>(
  setItems: Dispatch<SetStateAction<T[]>>,
) {
  return (event: DragEndEvent) => {
    setItems((items) => reorderItems(items, event))
  }
}

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
    useSensor(KeyboardSensor),
  )

  const [interactionType, setInteractionType] = useState<InteractionType>("prompt")
  const [interactionDraft, setInteractionDraft] = useState<InteractionDraft>(createDefaultInteractionDraft)

  const patchInteractionDraft = (updates: Partial<InteractionDraft>) => {
    setInteractionDraft((current) => ({ ...current, ...updates }))
  }

  const addInteraction = () => {
    setInteractions((items) => [
      ...items,
      {
        _id: makeId(),
        type: interactionType,
        config: buildInteractionConfig(interactionType, interactionDraft),
      },
    ])
    setInteractionDraft(createDefaultInteractionDraft())
  }

  const addResource = (label: string, url: string) => {
    if (!label && !url) return
    setResources((items) => [...items, { _id: makeId(), label, url }])
  }

  const addHomework = (label: string, instructions: string, uploadRequired: boolean) => {
    if (!label && !instructions) return
    setHomework((items) => [...items, { _id: makeId(), label, instructions, upload_required: uploadRequired }])
  }

  const onSubmit = () => {
    const fd = new FormData()
    fd.set("moduleId", moduleId)
    fd.set("transcript", initialTranscript || "")
    fd.set("adminNotes", initialAdminNotes || "")
    fd.set("interactions", JSON.stringify(interactions.map(stripId)))
    fd.set("resources", JSON.stringify(resources.map(stripId)))
    fd.set("homework", JSON.stringify(homework.map(stripId)))
    start(async () => {
      await onSave(fd)
    })
  }

  return (
    <div className="space-y-6">
      <Section title="Interactions">
        <DndList
          sensors={sensors}
          items={interactions}
          onDragEnd={createDragEndHandler(setInteractions)}
          onDelete={(index) => setInteractions((items) => items.filter((_, itemIndex) => itemIndex !== index))}
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
                value={interactionType}
                onChange={(event) => setInteractionType(event.target.value as InteractionType)}
                className="flex h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm"
              >
                <option value="prompt">Prompt</option>
                <option value="poll">Poll (1–5)</option>
                <option value="quiz">Quiz</option>
                <option value="activity">Activity (multi)</option>
              </select>
            </div>
            {interactionType === "poll" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Min</Label>
                  <Input
                    value={interactionDraft.min}
                    onChange={(event) => patchInteractionDraft({ min: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max</Label>
                  <Input
                    value={interactionDraft.max}
                    onChange={(event) => patchInteractionDraft({ max: event.target.value })}
                  />
                </div>
              </div>
            ) : null}
          </div>
          {interactionType === "prompt" || interactionType === "activity" ? (
            <div className="space-y-1">
              <Label>Label</Label>
              <Input
                value={interactionDraft.label}
                onChange={(event) => patchInteractionDraft({ label: event.target.value })}
              />
            </div>
          ) : null}
          {interactionType === "poll" || interactionType === "quiz" ? (
            <div className="space-y-1">
              <Label>Question</Label>
              <Input
                value={interactionDraft.question}
                onChange={(event) => patchInteractionDraft({ question: event.target.value })}
              />
            </div>
          ) : null}
          {interactionType === "quiz" || interactionType === "activity" ? (
            <div className="space-y-1">
              <Label>Options (comma separated)</Label>
              <Input
                value={interactionDraft.options}
                onChange={(event) => patchInteractionDraft({ options: event.target.value })}
              />
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" onClick={addInteraction} disabled={pending}>
              Add interaction
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Resources">
        <DndList
          sensors={sensors}
          items={resources}
          onDragEnd={createDragEndHandler(setResources)}
          onDelete={(index) => setResources((items) => items.filter((_, itemIndex) => itemIndex !== index))}
          render={(it: WithId<ResourceItem>) => (
            <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
              <span className="font-medium">{it.label || "Resource"}</span> — {it.url}
              {it.storage_path ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="ml-2 h-auto p-0 text-[10px] text-rose-500 underline-offset-2 hover:text-rose-600"
                  onClick={async () => {
                    try {
                      await fetch(`/api/admin/modules/${moduleId}/resource?path=${encodeURIComponent(it.storage_path!)}`, {
                        method: "DELETE",
                      })
                      setResources((items) => items.filter((resource) => resource._id !== it._id))
                    } catch {}
                  }}
                >
                  Delete file
                </Button>
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
          onDragEnd={createDragEndHandler(setHomework)}
          onDelete={(index) => setHomework((items) => items.filter((_, itemIndex) => itemIndex !== index))}
          render={(it: WithId<HomeworkItem>) => (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{it.label || "Item"}</span>
              {it.upload_required ? " — upload required" : ""}
              {it.instructions ? <div className="mt-1 whitespace-pre-wrap">{it.instructions}</div> : null}
            </div>
          )}
        />
        <AddHomework onAdd={addHomework} />
      </Section>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={pending}>
          Save content
        </Button>
      </div>
    </div>
  )
}

function normalizeArray<T>(arr: unknown[]): WithId<T>[] {
  if (!Array.isArray(arr)) return []
  return (arr as T[]).map((item) => ({ ...(item as object), _id: makeId() } as WithId<T>))
}

function stripId<T extends { _id: string }>(item: T): Omit<T, "_id"> {
  const { _id, ...rest } = item
  void _id
  return rest as Omit<T, "_id">
}
