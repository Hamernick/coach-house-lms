"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { NotebookPen, Play } from "lucide-react"
import type { ClassDef } from "./types"

export function ClassOverview({ c, onStartModule }: { c: ClassDef; onStartModule?: (moduleId: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
          <p className="text-muted-foreground">{c.blurb}</p>
        </div>
        <Badge>Class</Badge>
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.modules.map((m, i) => (
          <Card key={m.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <NotebookPen className="h-4 w-4" /> {m.title}
              </CardTitle>
              <CardDescription>{m.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Lesson {i + 1}</div>
              {c.slug ? (
                <Button asChild size="sm">
                  <Link href={`/class/${c.slug}/module/${i + 1}`}>
                    <Play className="mr-2 h-4 w-4" /> Start
                  </Link>
                </Button>
              ) : (
                <Button size="sm" onClick={() => onStartModule?.(m.id)}>
                  <Play className="mr-2 h-4 w-4" /> Start
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
