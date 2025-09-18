import Link from "next/link"

import type { ClassSummary } from "@/lib/classes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"

export function ClassesList({ items }: { items: ClassSummary[] }) {
  if (items.length === 0) {
    return (
      <DashboardEmptyState
        title="No classes yet"
        description="Create a class from the admin area to populate this list."
        actionLabel="Go to dashboard"
        onActionHref="/dashboard"
      />
    )
  }

  return (
    <div className="grid gap-4">
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
              <Link href={`/class/${item.slug}/module/1`}>Open</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
