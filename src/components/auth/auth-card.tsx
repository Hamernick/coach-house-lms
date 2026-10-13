import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AuthCardProps = {
  title: string
  description?: string
  children: ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-balance text-sm text-muted-foreground">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
