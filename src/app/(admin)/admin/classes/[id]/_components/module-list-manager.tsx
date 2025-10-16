"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"
import { Loader2, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { deleteModuleAction, reorderModulesAction, setModulePublishedAction } from "../actions"
import { cn } from "@/lib/utils"

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
  classPublished,
}: {
  classId: string
  modules: ModuleItem[]
  classPublished: boolean
}) {
  const sorted = useMemo(() => {
    const byIndex = [...modules].sort((a, b) => a.idx - b.idx)
    const published = byIndex.filter((module) => module.published)
    const drafts = byIndex.filter((module) => !module.published)
    return [...published, ...drafts]
  }, [modules])
  const [items, setItems] = useState(sorted)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    setItems(sorted)
  }, [sorted])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    // Compute the next list outside of setState updater to avoid side-effects during render
    const oldIndex = items.findIndex((module) => module.id === active.id)
    const newIndex = items.findIndex((module) => module.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex).map((module, index) => ({
      ...module,
      idx: index + 1,
    }))

    setItems(next)

    // Persist the new order in a transition (non-blocking UI)
    startTransition(async () => {
      await reorderModulesAction(
        classId,
        next.map((module) => module.id)
      )
    })
  }

  const publishedItems = items.filter((module) => module.published)
  const draftItems = items.filter((module) => !module.published)

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Published modules
                </h3>
                {isPending ? <p className="text-xs text-muted-foreground">Saving new order…</p> : null}
              </div>
              {publishedItems.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No published modules yet. Publish a module to make it available to learners.
                </p>
              ) : (
                <ul className="space-y-3">
                  {publishedItems.map((item) => (
                    <SortableModuleRow
                      key={item.id}
                      module={item}
                      classId={classId}
                      disabled={isPending}
                      classPublished={classPublished}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Unpublished
                </h3>
              </div>
              {draftItems.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  All modules are published.
                </p>
              ) : (
                <ul className="space-y-3">
                  {draftItems.map((item) => (
                    <SortableModuleRow
                      key={item.id}
                      module={item}
                      classId={classId}
                      disabled={isPending}
                      classPublished={classPublished}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableModuleRow({
  module,
  classId,
  disabled,
  classPublished,
}: {
  module: ModuleItem
  classId: string
  disabled: boolean
  classPublished: boolean
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
      className={cn(
        "rounded-xl border p-4 shadow-sm transition-colors",
        module.published
          ? "bg-card/60"
          : "border-dashed border-muted-foreground/40 bg-muted/30"
      )}
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold leading-tight">Module {module.idx}</span>
              <Badge
                variant={module.published ? "default" : "outline"}
                className="uppercase tracking-wide"
              >
                {module.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <span className="text-sm text-foreground">{module.title}</span>
            <span className="text-xs text-muted-foreground">Slug: {module.slug}</span>
          </div>
        </div>
        <ModuleActions module={module} classId={classId} disabled={disabled} classPublished={classPublished} />
      </div>
    </li>
  )
}

function ModuleActions({
  module,
  classId,
  disabled,
  classPublished,
}: {
  module: ModuleItem
  classId: string
  disabled: boolean
  classPublished: boolean
}) {
  const [publishPending, startPublish] = useTransition()
  const [menuPending, startMenu] = useTransition()
  const router = useRouter()

  const publishDisabled = !classPublished && !module.published

  const handleToggle = () => {
    if (publishDisabled) return
    startPublish(async () => {
      await setModulePublishedAction(module.id, classId, !module.published)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!confirm("Delete this module?")) return
    const fd = new FormData()
    fd.append("moduleId", module.id)
    fd.append("classId", classId)
    startMenu(async () => {
      await deleteModuleAction(fd)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <Button
        type="button"
        size="sm"
        variant={module.published ? "outline" : "default"}
      disabled={disabled || publishPending || publishDisabled}
        onClick={handleToggle}
        className="min-w-[6rem]"
      >
        {publishPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {module.published ? "Unpublish" : "Publish"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={menuPending}
          >
            {menuPending ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
            <span className="sr-only">Module actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Module actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/modules/${module.id}`}>Edit module</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            Delete module
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
