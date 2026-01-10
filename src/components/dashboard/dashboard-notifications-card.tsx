import Link from "next/link"
import { ArrowUpRight, Bell } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type DashboardNotificationItem = {
  id: string
  title: string
  description: string
  href?: string
  badge?: string
}

export function DashboardNotificationsCard({
  items,
  className,
}: {
  items: DashboardNotificationItem[]
  className?: string
}) {
  if (items.length === 0) return null
  const visible = items.slice(0, 2)

  return (
    <Card className={cn("border-border/70 bg-card/70", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
          Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {visible.map((item) => {
            const content = (
              <>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.badge ? (
                      <Badge variant="outline" className="rounded-full">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                </div>
                {item.href ? (
                  <ArrowUpRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                ) : null}
              </>
            )

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    prefetch
                    href={item.href}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 transition-colors hover:bg-accent/40"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
