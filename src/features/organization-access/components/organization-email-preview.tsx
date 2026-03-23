"use client"

import { useId } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CoachHouseEmailPreview } from "../lib/email-foundation"

export function OrganizationEmailPreview({
  preview,
}: {
  preview: CoachHouseEmailPreview
}) {
  const frameTitle = useId()

  return (
    <Card className="border-border/70 bg-background/80 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide"
          >
            {preview.family === "app" ? "App-owned" : "Supabase auth"}
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide"
          >
            {preview.category}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg">{preview.title}</CardTitle>
          <CardDescription className="text-sm leading-6">
            {preview.description}
          </CardDescription>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Subject
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{preview.subject}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {preview.previewText}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-[#ece7df] p-3 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.45)]">
          <iframe
            title={`${frameTitle}-${preview.id}`}
            srcDoc={preview.html}
            className="h-[820px] w-full rounded-[20px] border border-border/70 bg-white"
          />
        </div>
      </CardContent>
    </Card>
  )
}
