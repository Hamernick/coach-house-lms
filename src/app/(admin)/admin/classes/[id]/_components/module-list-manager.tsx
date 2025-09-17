"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { deleteModuleAction, reorderModulesAction } from "../actions"
import { ModulePublishedToggle } from "./module-published-toggle"

type ModuleItem = {
  id: string
  title: string
  slug: string
  idx: number
  published: boolean
}

export function ModuleListManager({
  classId,
  modules,
}: {
  classId: string
  modules: ModuleItem[]
}) {
  const sorted = useMemo(() => [...modules].sort((a, b) => a.idx - b.idx), [modules])
  const [items, setItems] = useState(sorted)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    setItems((current) => {
      const oldIndex = current.findIndex((module) => module.id === active.id)
      const newIndex = current.findIndex((module) => module.id === over.id)
      const next = arrayMove(current, oldIndex, newIndex).map((module, index) => ({
        ...module,
        idx: index + 1,
      }))

      startTransition(async () => {
        await reorderModulesAction(
          classId,
          next.map((module) => module.id)
        )
      })

      return next
    })
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {items.map((item) => (
              <SortableModuleRow
                key={item.id}
                module={item}
                classId={classId}
                disabled={isPending}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {isPending ? <p className="text-xs text-muted-foreground">Saving new order…</p> : null}
    </div>
  )
}

function SortableModuleRow({
  module,
  classId,
  disabled,
}: {
  module: ModuleItem
  classId: string
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: module.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-xl border bg-card/60 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <button
            type="button"
            className="mt-1 text-muted-foreground transition hover:text-foreground"
            aria-label="Reorder module"
            {...attributes}
            {...listeners}
            disabled={disabled}
          >
            <IconGripVertical className="size-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Module {module.idx}</span>
              <Badge variant={module.published ? "default" : "outline"}>
                {module.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">{module.title}</span>
            <span className="text-xs text-muted-foreground">Slug: {module.slug}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <ModulePublishedToggle
            moduleId={module.id}
            classId={classId}
            published={module.published}
          />
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/modules/${module.id}`}>Edit</Link>
            </Button>
            <form action={deleteModuleAction} className="inline">
              <input type="hidden" name="moduleId" value={module.id} />
              <input type="hidden" name="classId" value={classId} />
              <Button size="sm" variant="destructive">
                Delete
              </Button>
            </form>
          </div>
        </div>
      </div>
    </li>
  )
}
