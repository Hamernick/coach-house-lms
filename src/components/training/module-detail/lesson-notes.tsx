"use client"

import FileText from "lucide-react/dist/esm/icons/file-text"
import BookOpen from "lucide-react/dist/esm/icons/book-open"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"

interface LessonNotesProps {
  title: string
  content: string
}

export function LessonNotes({ title, content }: LessonNotesProps) {
  const { schedule, pending } = useCoachingBooking()
  const showCoachingCta = content.includes("Use a coaching session to develop your origin story.")

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
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Want help drafting your origin story? Book a coaching session.
              </p>
              <Button type="button" size="sm" onClick={() => void schedule()} disabled={pending}>
                {pending ? "Opening..." : "Book a session"}
              </Button>
            </div>
            <div className="mt-2">
              <CoachingAvatarGroup size="sm" />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
