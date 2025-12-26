"use client"

import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import Play from "lucide-react/dist/esm/icons/play"
import VideoIcon from "lucide-react/dist/esm/icons/video"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface VideoSectionProps {
  embedUrl: string | null
  fallbackUrl: string | null
}

export function VideoSection({ embedUrl, fallbackUrl }: VideoSectionProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-6 py-3">
        <div className="flex items-center gap-2 text-base font-semibold">
          <VideoIcon className="h-4 w-4" />
          <span>Lesson Video</span>
        </div>
      </div>
      <CardContent className="overflow-hidden rounded-b-2xl p-0">
        {embedUrl ? (
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={embedUrl}
              title="Lesson video"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : fallbackUrl ? (
          <div className="flex flex-col items-center gap-3 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            <p>This video is hosted externally — open it in a new tab to watch.</p>
            <Button asChild size="sm">
              <a href={fallbackUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open video
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid aspect-video place-items-center bg-muted">
            <Button variant="secondary" size="sm" className="pointer-events-none">
              <Play className="mr-2 h-4 w-4" /> Video coming soon
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
