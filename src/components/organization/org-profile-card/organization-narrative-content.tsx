import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { cn } from "@/lib/utils"

export function OrganizationNarrativeContent({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  if (!value.trim()) return null

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words",
        "prose-p:my-2 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  )
}
