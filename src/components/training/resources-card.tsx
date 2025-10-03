"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileDown, FileText, Link as LinkIcon } from "lucide-react"

type Item = { id: string; label: string; href: string; icon: typeof FileText; download?: boolean }

export function ResourcesCard() {
  const items: Item[] = [
    { id: "doc", label: "Syllabus (Google Doc)", href: "#", icon: FileText },
    { id: "slides", label: "Lecture Slides (Google Slides)", href: "#", icon: LinkIcon },
    { id: "pdf", label: "Reference PDF", href: "#", icon: FileText, download: true },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resources</CardTitle>
        <CardDescription>Extra materials for this module.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(({ id, label, href, icon: Icon, download }) => (
          <div key={id} className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <a href={href} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open
                </a>
              </Button>
              {download && (
                <Button asChild size="sm" variant="secondary">
                  <a href={href} download>
                    <FileDown className="mr-2 h-4 w-4" /> Download
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
