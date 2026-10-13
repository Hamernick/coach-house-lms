"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Textarea } from "@/components/ui/textarea"

export function MarkdownEditor({
  name,
  defaultValue = "",
}: {
  name: string
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={name}>
          Markdown content
        </label>
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-[300px]"
        />
      </div>
      <div className="rounded-lg border bg-card/40 p-4">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <article className="prose prose-sm prose-invert mt-3 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "_No content yet._"}</ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
