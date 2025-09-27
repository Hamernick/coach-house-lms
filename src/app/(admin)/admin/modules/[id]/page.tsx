import Link from "next/link"
import { notFound } from "next/navigation"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requireAdmin } from "@/lib/admin/auth"

import { ModulePublishedToggle } from "../../classes/[id]/_components/module-published-toggle"
import { MarkdownEditor } from "./_components/markdown-editor"
import {
  deleteModuleFromDetailAction,
  removeModuleDeckAction,
  updateModuleAssignmentAction,
  updateModuleDetailsAction,
  uploadModuleDeckAction,
} from "./actions"
import { AssignmentEditor } from "./_components/assignment-editor"

export default async function AdminModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from("modules")
    .select(
      "id, class_id, idx, slug, title, description, video_url, content_md, duration_minutes, deck_path, published, classes ( id, title, slug )"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  const moduleRecord = data as {
    id: string
    class_id: string
    idx: number
    slug: string
    title: string
    description: string | null
    video_url: string | null
    content_md: string | null
    duration_minutes: number | null
    deck_path: string | null
    published: boolean
    classes: { id: string; title: string; slug: string } | null
  } | null

  if (!moduleRecord || !moduleRecord.classes) {
    notFound()
  }

  const parentClass = moduleRecord.classes
  const deckFileName = moduleRecord.deck_path ? moduleRecord.deck_path.split("/").pop() ?? "Deck" : null

  const { data: assignment } = await supabase
    .from("module_assignments")
    .select("schema, complete_on_submit")
    .eq("module_id", moduleRecord.id)
    .maybeSingle<{ schema: Record<string, unknown> | null; complete_on_submit: boolean | null }>()

  return (
    <div className="space-y-6">
      <DashboardBreadcrumbs
        segments={[
          { label: "Admin", href: "/admin/classes" },
          { label: parentClass.title, href: `/admin/classes/${parentClass.id}` },
          { label: moduleRecord.title },
        ]}
      />
      <Card className="bg-card/60">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{moduleRecord.title}</CardTitle>
            <CardDescription>Update module content and metadata.</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <span className="text-sm font-medium">Published</span>
            <ModulePublishedToggle moduleId={moduleRecord.id} classId={moduleRecord.class_id} published={moduleRecord.published} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={updateModuleDetailsAction} className="space-y-5">
            <input type="hidden" name="moduleId" value={moduleRecord.id} />
            <input type="hidden" name="classId" value={moduleRecord.class_id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={moduleRecord.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={moduleRecord.slug} required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={moduleRecord.description ?? ""}
                  className="min-h-24"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input id="videoUrl" name="videoUrl" defaultValue={moduleRecord.video_url ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min={0}
                    defaultValue={moduleRecord.duration_minutes ?? ""}
                  />
                </div>
              </div>
            </div>
            <MarkdownEditor name="contentMd" defaultValue={moduleRecord.content_md ?? ""} />
            <Button type="submit">Save changes</Button>
          </form>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Assignment</p>
                <p className="text-xs text-muted-foreground">Define form schema and completion behavior.</p>
              </div>
            </div>
            <AssignmentEditor
              moduleId={moduleRecord.id}
              initialSchema={assignment?.schema ?? null}
              initialCompleteOnSubmit={Boolean(assignment?.complete_on_submit)}
              onSave={updateModuleAssignmentAction}
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Slide deck</p>
                <p className="text-xs text-muted-foreground">
                  Upload a PDF deck for learners to download alongside this module.
                </p>
              </div>
              {moduleRecord.deck_path ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/api/admin/modules/${moduleRecord.id}/deck`} target="_blank" rel="noopener">
                    View deck
                  </Link>
                </Button>
              ) : null}
            </div>
            {moduleRecord.deck_path ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{deckFileName}</span>
                <form action={removeModuleDeckAction} className="inline-flex">
                  <input type="hidden" name="moduleId" value={moduleRecord.id} />
                  <input type="hidden" name="classId" value={moduleRecord.class_id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Remove deck
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No deck uploaded yet.</p>
            )}
            <form
              action={uploadModuleDeckAction}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              encType="multipart/form-data"
            >
              <input type="hidden" name="moduleId" value={moduleRecord.id} />
              <input type="hidden" name="classId" value={moduleRecord.class_id} />
              <Input type="file" name="deck" accept="application/pdf" required className="sm:w-auto" />
              <Button type="submit" size="sm">
                Upload deck
              </Button>
            </form>
          </div>

          <form action={deleteModuleFromDetailAction} className="inline-flex">
            <input type="hidden" name="moduleId" value={moduleRecord.id} />
            <input type="hidden" name="classId" value={moduleRecord.class_id} />
            <Button type="submit" variant="destructive">
              Delete module
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
