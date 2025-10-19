"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import type { Resource } from "@/lib/lessons/types"

export function ResourceList({
  resources,
  onAdd,
  onUpdate,
  onRemove,
}: {
  resources: Pick<Resource, "id" | "title" | "url">[]
  onAdd: () => void
  onUpdate: (id: string, field: "title" | "url", value: string) => void
  onRemove: (id: string) => void
}) {
  const hasResources = resources.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-sm font-medium leading-tight">Resources</Label>
          <p className="text-xs text-muted-foreground">
            Link supporting articles, handouts, or tools for learners.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Resource
        </Button>
      </div>

      {hasResources ? (
        <div className="space-y-3">
          {resources.map((resource, index) => {
            const titleId = `resource-${resource.id}-title`
            const urlId = `resource-${resource.id}-url`

            return (
              <Card key={resource.id} className="gap-0">
                <CardHeader className="relative flex flex-wrap items-start gap-3 border-b pb-4 pr-14">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold">
                      Resource {index + 1}
                    </CardTitle>
                    <CardDescription>
                      Give learners a clear title and a trusted link.
                    </CardDescription>
                  </div>
                  <div className="absolute right-3 top-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(resource.id)}
                      aria-label={`Remove resource ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 pb-6 pt-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={titleId}>Title</Label>
                    <Input
                      id={titleId}
                      placeholder="Recorded workshop: Discovering Your Story"
                      value={resource.title}
                      onChange={(e) => onUpdate(resource.id, "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={urlId}>Link</Label>
                    <Input
                      id={urlId}
                      placeholder="https://example.org/resource.pdf"
                      inputMode="url"
                      value={resource.url}
                      onChange={(e) => onUpdate(resource.id, "url", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No resources yet. Add links to deepen the module content.
        </div>
      )}
    </div>
  )
}
