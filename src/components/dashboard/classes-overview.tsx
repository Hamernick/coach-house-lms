import Link from "next/link"

import { listClasses } from "@/lib/classes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"

export async function ClassesHighlights() {
  const { items } = await listClasses({ pageSize: 4 })

  if (items.length === 0) {
    return (
      <DashboardEmptyState
        title="No classes published"
        description="Create your first class to unlock analytics and module progress tracking."
        actionLabel="Create class"
        onActionHref="/dashboard/classes"
        helperText="Classes automatically appear here once they are published."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
      {items.map((item) => (
        <Card key={item.id} className="bg-card/70">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
              <Badge variant={item.published ? "default" : "outline"}>
                {item.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
              {item.description ?? "No description yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p>{item.moduleCount} modules</p>
              <p className="text-xs">Progress stub · {item.progressPercent}%</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/class/${item.slug}/module/1`}>View</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
