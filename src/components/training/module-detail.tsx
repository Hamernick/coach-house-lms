"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronRight, Play, Send, Video } from "lucide-react"
import Link from "next/link"
import { ResourcesCard } from "./resources-card"
import type { ClassDef, Module } from "./types"
import { useCallback, useState } from "react"
import { ClientOnly } from "@/components/client-only"

const RichTextEditor = dynamic(() => import("./rich-text-editor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-md border bg-muted/30" />,
})

export function ModuleDetail({ c, m }: { c: ClassDef; m: Module }) {
  const [homework, setHomework] = useState<string>("")
  const handleSubmitHomework = useCallback(() => {
    console.log("Submit homework", { classId: c.id, moduleId: m.id, homework })
  }, [c.id, m.id, homework])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{c.title}</span>
          <ChevronRight className="h-4 w-4" />
          <span>Module</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{m.title}</h1>
        {m.subtitle && <p className="text-muted-foreground">{m.subtitle}</p>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4" /> Lesson Video
          </CardTitle>
          <CardDescription>Watch before attempting the homework.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden rounded-lg border">
            <div className="grid aspect-video w-full place-items-center bg-muted">
              <Button variant="secondary" size="sm" className="pointer-events-none">
                <Play className="mr-2 h-4 w-4" /> Placeholder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ResourcesCard />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Homework</CardTitle>
              <CardDescription>Summarize the lesson, 3 takeaways, 1 question.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientOnly fallback={<div className="h-[220px] animate-pulse rounded-md border bg-muted/30" />}>
            <RichTextEditor value={homework} onChange={setHomework} />
          </ClientOnly>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-2">
          <Button onClick={handleSubmitHomework}>
            <Send className="mr-2 h-4 w-4" /> Submit
          </Button>
        </CardFooter>
      </Card>

      {(() => {
        const idx = c.modules.findIndex((x) => x.id === m.id)
        const next = idx >= 0 ? c.modules[idx + 1] : null
        if (next && c.slug) {
          const nextHref = `/class/${c.slug}/module/${idx + 2}`
          return (
            <Link
              href={nextHref}
              className="rounded-xl border bg-card/60 p-4 transition hover:bg-accent/30 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">Next</p>
                <p className="text-sm text-muted-foreground">{`Module ${idx + 2} — ${next.title}`}</p>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )
        }
        return (
          <div
            aria-disabled
            className="rounded-xl border bg-card/60 p-4 flex items-center justify-between opacity-60 cursor-not-allowed"
          >
            <div>
              <p className="text-sm font-medium">Next</p>
              <p className="text-sm text-muted-foreground">All modules complete</p>
            </div>
            <ArrowRight className="h-5 w-5" />
          </div>
        )
      })()}
    </div>
  )
}
