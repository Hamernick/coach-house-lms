"use client"

import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

function flattenNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) return node.map(flattenNodeText).join("")
  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode }
    return flattenNodeText(props.children)
  }
  return ""
}

function slugifyMarkdownHeading(children: ReactNode) {
  return flattenNodeText(children)
    .replace(/\\+/g, "")
    .replace(/[.*_[\]`#>]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function FiscalSponsorshipMarkdownDocument({
  className,
  markdown,
}: {
  className?: string
  markdown: string
}) {
  return (
    <article
      className={cn(
        "tiptap prose prose-sm dark:prose-invert prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-p:leading-relaxed prose-li:my-1 prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-hr:border-border prose-hr:my-8 max-w-none",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1({ children }) {
            const id = slugifyMarkdownHeading(children)
            if (!id) return null

            return (
              <h1
                id={id}
                className="border-border/70 mt-10 border-t pt-8 first:mt-0 first:border-t-0 first:pt-0"
              >
                {children}
              </h1>
            )
          },
          h2({ children }) {
            const id = slugifyMarkdownHeading(children)
            if (!id) return null

            return <h2 id={id}>{children}</h2>
          },
          h3({ children }) {
            const id = slugifyMarkdownHeading(children)
            if (!id) return null

            return <h3 id={id}>{children}</h3>
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
