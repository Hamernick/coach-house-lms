"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ClassPublishedToggle } from "@/app/(admin)/admin/classes/_components/class-published-toggle"
import { ModulePublishedToggle } from "@/app/(admin)/admin/classes/[id]/_components/module-published-toggle"
import { deleteClassAction, reorderClassesAction } from "@/app/(admin)/admin/classes/actions"
import { createModuleAction, deleteModuleAction, reorderModulesAction } from "@/app/(admin)/admin/classes/[id]/actions"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type TreeClass = {
  id: string
  slug: string
  title: string
  position?: number | null
  published: boolean
  modules: Array<{ id: string; index: number; title: string; published: boolean }>
}

export function ClassesDnd({ tree }: { tree: TreeClass[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )
  const [items, setItems] = useState<TreeClass[]>(tree)
  const [pendingOrder, startTransition] = useTransition()

  useEffect(() => {
    setItems(tree)
  }, [tree])

  const handleModulesReordered = useCallback((classId: string, nextModules: TreeClass["modules"]) => {
    setItems((prev) =>
      prev.map((klass) => (klass.id === classId ? { ...klass, modules: nextModules } : klass))
    )
  }, [])

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setItems((current) => {
        const oldIndex = current.findIndex((klass) => klass.id === active.id)
        const newIndex = current.findIndex((klass) => klass.id === over.id)
        if (oldIndex === -1 || newIndex === -1) {
          return current
        }

        const next = arrayMove(current, oldIndex, newIndex).map((klass, index) => ({
          ...klass,
          position: index + 1,
        }))

        startTransition(async () => {
          await reorderClassesAction(next.map((klass) => klass.id))
        })

        return next
      })
    },
    [startTransition]
  )

  const ids = items.map((c) => c.id)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((c) => (
          <SortableCard key={c.id} id={c.id}>
            <Card className="bg-card/60">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="text-xs tabular-nums">{c.modules.length} modules</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-xs">Slug: {c.slug}</span>
                    {typeof c.position === 'number' ? (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-xs">Position: {c.position}</span>
                      </>
                    ) : null}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Published</span>
                  <ClassPublishedToggle classId={c.id} published={c.published} />
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/classes/${c.id}`}>Edit session</Link>
                  </Button>
                  <form action={deleteClassAction} className="inline-flex" onSubmit={(e) => { if (!confirm('Delete session and all modules?')) e.preventDefault() }}>
                    <input type="hidden" name="classId" value={c.id} />
                    <Button type="submit" size="sm" variant="destructive">Delete</Button>
                  </form>
                  <form action={createModuleAction} className="inline-flex">
                    <input type="hidden" name="classId" value={c.id} />
                    <Button type="submit" size="sm">Add module</Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ModuleDnd
                  classId={c.id}
                  slug={c.slug}
                  modules={c.modules}
                  onReorder={(next) => handleModulesReordered(c.id, next)}
                />
              </CardContent>
            </Card>
          </SortableCard>
        ))}
      </SortableContext>
      {pendingOrder ? (
        <p className="mt-3 text-xs text-muted-foreground">Saving session order…</p>
      ) : null}
    </DndContext>
  )
}

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab">
      {children}
    </div>
  )
}

function ModuleDnd({
  classId,
  slug,
  modules,
  onReorder,
}: {
  classId: string
  slug: string
  modules: Array<{ id: string; index: number; title: string; published: boolean }>
  onReorder: (next: Array<{ id: string; index: number; title: string; published: boolean }>) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )
  const [items, setItems] = useState(modules)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setItems(modules)
  }, [modules])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItems((current) => {
      const oldIndex = current.findIndex((module) => module.id === active.id)
      const newIndex = current.findIndex((module) => module.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return current

      const next = arrayMove(current, oldIndex, newIndex).map((module, idx) => ({
        ...module,
        index: idx + 1,
      }))

      startTransition(async () => {
        await reorderModulesAction(classId, next.map((module) => module.id))
      })
      onReorder(next)

      return next
    })
  }

  const ids = items.map((module) => module.id)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No modules yet.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.map((m) => (
              <SortableRow key={m.id} id={m.id}>
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-medium">{m.index}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m.title}</span>
                      <span className="text-xs text-muted-foreground">/class/{slug}/module/{m.index}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">Published</span>
                    <ModulePublishedToggle moduleId={m.id} classId={classId} published={m.published} />
                    {/* Editing modules uses the wizard from the module page; remove direct editor link */}
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/class/${slug}/module/${m.index}`} target="_blank" rel="noopener">Open page</Link>
                    </Button>
                    <form action={deleteModuleAction} className="inline-flex" onSubmit={(e) => { if (!confirm('Delete module?')) e.preventDefault() }}>
                      <input type="hidden" name="moduleId" value={m.id} />
                      <input type="hidden" name="classId" value={classId} />
                      <Button type="submit" size="sm" variant="destructive">Delete</Button>
                    </form>
                  </div>
                </div>
              </SortableRow>
            ))}
          </div>
        )}
      </SortableContext>
      {pending ? (
        <p className="pt-2 text-xs text-muted-foreground">Saving module order…</p>
      ) : null}
    </DndContext>
  )
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab">
      {children}
    </div>
  )
}
