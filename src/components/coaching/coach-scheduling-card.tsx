"use client"

import Link from "next/link"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CoachSchedulingCardProps = {
  className?: string
  title?: string
  description?: string
}

export function CoachSchedulingCard({
  className,
  title = "Coach scheduling",
  description = "Get focused support on your current class and next step.",
}: CoachSchedulingCardProps) {
  return (
    <Card className={cn("rounded-2xl border-border/60 bg-muted/10 shadow-none", className)}>
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex justify-center pb-1">
          <CoachingAvatarGroup size="sm" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-0">
        <Button asChild size="sm" className="w-full">
          <Link href="/coaching">Book a session</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
