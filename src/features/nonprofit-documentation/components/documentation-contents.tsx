import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

type Contents = ReadonlyArray<readonly [string, string]>

function ContentsLinks({ items }: { items: Contents }) {
  return (
    <nav aria-label="Article contents">
      <ol className="space-y-1">
        {items.map(([id, title]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-ring flex min-h-11 items-center rounded-md px-2 text-sm leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-none xl:min-h-8 xl:text-xs"
            >
              {title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function DocumentationMobileContents({
  items,
  className,
}: {
  items: Contents
  className?: string
}) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn("mt-6 border-b xl:hidden print:hidden", className)}
    >
      <AccordionItem value="contents">
        <AccordionTrigger className="min-h-11">On this page</AccordionTrigger>
        <AccordionContent>
          <ContentsLinks items={items} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function DocumentationDesktopContents({ items }: { items: Contents }) {
  return (
    <aside className="hidden xl:block print:hidden" aria-label="On this page">
      <div className="sticky top-24 max-h-[calc(100svh-12rem)] overflow-y-auto border-l pl-4">
        <p className="mb-3 px-2 text-xs font-semibold">On this page</p>
        <ContentsLinks items={items} />
      </div>
    </aside>
  )
}
