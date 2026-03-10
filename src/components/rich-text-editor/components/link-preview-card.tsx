import ExternalLink from "lucide-react/dist/esm/icons/external-link"

import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseImage,
  GlimpseTitle,
  GlimpseTrigger,
} from "@/components/kibo-ui/glimpse"
import type { LinkPreviewMeta } from "../types"

type LinkPreviewCardProps = {
  href: string
  meta?: LinkPreviewMeta
}

export function LinkPreviewCard({ href, meta }: LinkPreviewCardProps) {
  const display = href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")

  return (
    <Glimpse openDelay={150}>
      <GlimpseTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs text-foreground transition hover:border-border hover:bg-muted/60"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="truncate max-w-[14rem] sm:max-w-[20rem]">
            {meta?.title ?? display}
          </span>
        </a>
      </GlimpseTrigger>
      <GlimpseContent className="w-80">
        {meta?.image ? <GlimpseImage src={meta.image} alt={meta?.title ?? display} /> : null}
        <GlimpseTitle>{meta?.title ?? display}</GlimpseTitle>
        <GlimpseDescription>{meta?.description ?? "Opens in a new tab"}</GlimpseDescription>
      </GlimpseContent>
    </Glimpse>
  )
}
