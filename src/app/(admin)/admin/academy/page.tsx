import { CreateEntityPopover } from "@/components/admin/create-entity-popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin/auth"
import { fetchSidebarTree } from "@/lib/academy"

import { ClassesDnd } from "./_components/classes-dnd"

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
        <CreateEntityPopover classes={tree.map((c) => ({ id: c.id, title: c.title }))} />
      </div>
      <div className="space-y-4">
        {tree.length === 0 ? (
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle>No sessions yet</CardTitle>
              <CardDescription>Create your first session to begin.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateEntityPopover classes={tree.map((c) => ({ id: c.id, title: c.title }))} />
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
