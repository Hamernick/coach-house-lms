"use client"

import Plus from "lucide-react/dist/esm/icons/plus"
import X from "lucide-react/dist/esm/icons/x"
import LinkIcon from "lucide-react/dist/esm/icons/link"
import VideoIcon from "lucide-react/dist/esm/icons/video"
import Globe from "lucide-react/dist/esm/icons/globe"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RichTextEditor } from "./rich-text-editor-client"
import { LESSON_SUBTITLE_MAX_LENGTH, LESSON_TITLE_MAX_LENGTH } from "@/lib/lessons/limits"
import { MAX_CLASS_LINKS } from "@/lib/lessons/constants"
import { memo } from "react"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import type { LessonLink } from "@/lib/lessons/types"

function LandingStepBase({
  title,
  subtitle,
  body,
  videoUrl,
  links,
  onTitleChange,
  onSubtitleChange,
  onBodyChange,
  onVideoUrlChange,
  onAddLink,
  onUpdateLink,
  onRemoveLink,
}: {
  title: string
  subtitle: string
  body: string
  videoUrl: string
  links: LessonLink[]
  onTitleChange: (value: string) => void
  onSubtitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onVideoUrlChange: (value: string) => void
  onAddLink: () => void
  onUpdateLink: (id: string, key: "title" | "url", value: string) => void
  onRemoveLink: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Lesson Landing Page</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Create the main landing page for your lesson. This is what students will see first.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Lesson Title *</Label>
            <span className="text-xs text-muted-foreground">
              {title.length}/{LESSON_TITLE_MAX_LENGTH}
            </span>
          </div>
          <Input
            id="title"
            placeholder="Introduction to Web Development"
            value={title}
            maxLength={LESSON_TITLE_MAX_LENGTH}
            onChange={(e) => onTitleChange(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="subtitle">Subtitle</Label>
            <span className="text-xs text-muted-foreground">
              {subtitle.length}/{LESSON_SUBTITLE_MAX_LENGTH}
            </span>
          </div>
          <Input
            id="subtitle"
            placeholder="Learn the fundamentals of HTML, CSS, and JavaScript"
            value={subtitle}
            maxLength={LESSON_SUBTITLE_MAX_LENGTH}
            onChange={(e) => onSubtitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Description</Label>
          <RichTextEditor value={body} onChange={onBodyChange} placeholder="Provide a detailed description..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">
            <VideoIcon className="mr-2 inline h-4 w-4" />
            YouTube Video URL
          </Label>
          <Input
            id="videoUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              <LinkIcon className="mr-2 inline h-4 w-4" />
              Additional Resources
            </Label>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {links.length}/{MAX_CLASS_LINKS}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={onAddLink} disabled={links.length >= MAX_CLASS_LINKS}>
              <Plus className="mr-1 h-4 w-4" />
              Add Resource
              </Button>
            </div>
          </div>

          {links.map((link) => {
            const Icon = PROVIDER_ICON[link.providerSlug] ?? Globe
            return (
              <Card key={link.id} className="p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Resource title"
                      value={link.title}
                      onChange={(e) => onUpdateLink(link.id, "title", e.target.value)}
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => onUpdateLink(link.id, "url", e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveLink(link.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const LandingStep = memo(LandingStepBase)
