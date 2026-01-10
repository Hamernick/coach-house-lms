"use client"

import { useState } from "react"
import FileText from "lucide-react/dist/esm/icons/file-text"
import BookOpen from "lucide-react/dist/esm/icons/book-open"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"

interface LessonNotesProps {
  title: string
  content: string
}

export function LessonNotes({ title, content }: LessonNotesProps) {
  const [pending, setPending] = useState(false)
  const showCoachingCta = content.includes("Use a coaching session to develop your origin story.")

  const handleSchedule = async () => {
    if (pending) return
    setPending(true)
    try {
      const response = await fetch("/api/meetings/schedule?host=joel", { method: "GET" })
      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string }
      if (!response.ok) {
        toast.error(payload.error ?? "Unable to schedule a meeting right now.")
        return
      }
      if (!payload.url) {
        toast.error("Scheduling link unavailable.")
        return
      }
      window.open(payload.url, "_blank", "noopener,noreferrer")
      toast.success("Opening your scheduling link.")
    } catch (error) {
      console.error(error)
      toast.error("Unable to schedule a meeting right now.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="gap-0">
      <CardHeader className="gap-1 px-6 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          Additional context and instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border/60 px-6 py-3">
        <article className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content}</ReactMarkdown>
        </article>
        {showCoachingCta ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Want help drafting your origin story? Book a coaching session.
            </p>
            <Button type="button" size="sm" onClick={handleSchedule} disabled={pending}>
              {pending ? "Opening..." : "Book a session"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
