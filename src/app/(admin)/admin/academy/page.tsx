import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireAdmin } from "@/lib/admin/auth"
import { fetchSidebarTree } from "@/lib/academy"

import { ClassPublishedToggle } from "../classes/_components/class-published-toggle"
import { ModulePublishedToggle } from "../classes/[id]/_components/module-published-toggle"
import { createClassAction, deleteClassAction, moveClassPositionAction, reorderClassesAction } from "../classes/actions"
import { ClassesDnd } from "./_components/classes-dnd"
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
import { createModuleAction, deleteModuleAction } from "../classes/[id]/actions"

export default async function AdminAcademyIndex() {
  await requireAdmin()
  const tree = await fetchSidebarTree({ includeDrafts: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Academy</h1>
          <p className="text-sm text-muted-foreground">Manage sessions and modules. Drafts are visible only to admins.</p>
        </div>
        <form action={createClassAction}>
          <Button type="submit" size="icon" variant="outline" aria-label="New session" title="New session">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>
      <div className="space-y-4">
        {tree.length === 0 ? (
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle>No sessions yet</CardTitle>
              <CardDescription>Create your first session to begin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createClassAction}>
                <Button type="submit" size="icon" variant="default" aria-label="Create session" title="Create session">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
        {(() => {
          const mapped = tree.map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            position: c.position ?? null,
            published: c.published,
            modules: c.modules.map((m) => ({ id: m.id, index: m.index, title: m.title, published: m.published })),
          }))
          return <ClassesDnd tree={mapped} />
        })()}
      </div>
    </div>
  )
}

// DnD class list moved into client component
