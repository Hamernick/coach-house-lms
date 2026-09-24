"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

export function DocumentationAiReview({
  prompt,
  copied,
  onCopy,
}: {
  prompt: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <Accordion type="single" collapsible className="mt-6 border-t">
      <AccordionItem value="ai-review" className="border-b-0">
        <AccordionTrigger>Optional AI review</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground max-w-2xl text-sm leading-5">
            Use this prompt with your own AI tool, then check its suggestions.
            Remove personal details and confidential records before sharing it
            with another service.
          </p>
          <pre className="bg-background mt-4 max-h-64 overflow-auto rounded-xl border p-4 text-xs leading-5 break-words whitespace-pre-wrap">
            {prompt}
          </pre>
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11 rounded-full"
            onClick={onCopy}
          >
            {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
            {copied ? "Copied" : "Copy prompt"}
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
