"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import FileIcon from "lucide-react/dist/esm/icons/file"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import LinkIcon from "lucide-react/dist/esm/icons/link"
import MessageSquareIcon from "lucide-react/dist/esm/icons/message-square"
import VideoIcon from "lucide-react/dist/esm/icons/video"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import type {
  FinancePlanResponse,
  FinancePlanResponseAttachmentKind,
} from "@/lib/prototype-lab/finance-plan-response"
import { cn } from "@/lib/utils"

const ACTION_LABELS = {
  agree: "Agreed",
  confirm: "Confirmed",
  deny: "Denied",
} as const

function AttachmentIcon({
  kind,
}: {
  kind: FinancePlanResponseAttachmentKind | "link"
}) {
  const Icon =
    kind === "image"
      ? ImageIcon
      : kind === "video"
        ? VideoIcon
        : kind === "document"
          ? FileIcon
          : LinkIcon
  return <Icon aria-hidden="true" className="size-3.5" />
}

function FinancePlanResponseHistoryItem({
  response,
}: {
  response: FinancePlanResponse
}) {
  const isResolved = response.state === "resolved"
  return (
    <article className="border-border/70 rounded-2xl border p-3">
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            isResolved ? "bg-emerald-500" : "bg-amber-500"
          )}
        />
        <span className="font-medium">
          {response.action
            ? ACTION_LABELS[response.action]
            : "Response in progress"}
        </span>
        <time
          className="text-muted-foreground ml-auto tabular-nums"
          dateTime={response.createdAt}
        >
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(response.createdAt))}
        </time>
      </div>

      {response.message ? (
        <p className="mt-2 text-sm leading-5 whitespace-pre-wrap">
          {response.message}
        </p>
      ) : null}

      {response.attachments.length || response.links.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {response.attachments.map((attachment) => (
            <a
              className="bg-muted hover:bg-accent inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors"
              href={attachment.url}
              key={attachment.id}
              rel="noreferrer"
              target="_blank"
            >
              <AttachmentIcon kind={attachment.kind} />
              <span className="truncate">{attachment.name}</span>
            </a>
          ))}
          {response.links.map((link) => (
            <a
              className="bg-muted hover:bg-accent inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors"
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              <AttachmentIcon kind={link.kind} />
              <span className="truncate">{link.host}</span>
            </a>
          ))}
        </div>
      ) : null}

      <p className="text-muted-foreground mt-2 text-[11px]">
        {response.viewId}
        {response.nodeId ? ` / ${response.nodeId}` : ""}
      </p>
    </article>
  )
}

export function FinancePlanResponseHistory({
  loading,
  responses,
}: {
  loading: boolean
  responses: FinancePlanResponse[]
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Open saved responses${responses.length ? ` (${responses.length})` : ""}`}
          className="relative size-10 rounded-full"
          size="icon"
          title="Saved responses"
          type="button"
          variant="ghost"
        >
          <MessageSquareIcon aria-hidden="true" className="size-4" />
          {responses.length ? (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 tabular-nums">
              {responses.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-2"
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <p className="text-sm font-semibold">Saved responses</p>
          {responses.some((response) => response.state === "resolved") ? (
            <CheckIcon
              aria-label="Includes resolved responses"
              className="size-4 text-emerald-600"
            />
          ) : null}
        </div>
        <ScrollArea className="max-h-96">
          <div className="space-y-2 p-1">
            {loading ? (
              <p className="text-muted-foreground p-3 text-sm">Loading…</p>
            ) : responses.length ? (
              responses.map((response) => (
                <FinancePlanResponseHistoryItem
                  key={response.id}
                  response={response}
                />
              ))
            ) : (
              <p className="text-muted-foreground p-3 text-sm">
                No responses yet.
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
