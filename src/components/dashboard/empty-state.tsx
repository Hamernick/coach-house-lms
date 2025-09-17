import Link from "next/link"
import { IconSparkles } from "@tabler/icons-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DashboardEmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onActionHref?: string
  helperText?: ReactNode
}

export function DashboardEmptyState({
  title,
  description,
  actionLabel,
  onActionHref,
  helperText,
}: DashboardEmptyStateProps) {
  return (
    <div className="px-4 lg:px-6">
      <Card className="border-dashed bg-card/60 text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            <IconSparkles className="text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {actionLabel && onActionHref ? (
            <Button asChild>
              <Link href={onActionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
          {helperText ? (
            <div className="text-xs text-muted-foreground">{helperText}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
