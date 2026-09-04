import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"

import { Button } from "@/components/ui/button"
import {
  WorkspaceNodeFrameBody,
  WorkspaceNodeFrameFooter,
  WorkspaceNodeFrameHeader,
  WorkspaceNodeFrameRoot,
  WorkspaceNodeFrameSurface,
} from "@/components/workspace/workspace-node-frame"
import { cn } from "@/lib/utils"

type WorkspaceActivityCardProps = {
  title: string
  description: string | null
  statusLabel: string
  status?: "completed" | "scheduled"
  metadata?: string[]
  href?: string | null
  actionLabel?: string | null
  external?: boolean
}

export function WorkspaceActivityCard({
  title,
  description,
  statusLabel,
  status = "scheduled",
  metadata = [],
  href = null,
  actionLabel = null,
  external = false,
}: WorkspaceActivityCardProps) {
  const StatusIcon =
    status === "completed" ? CheckCircle2Icon : CircleDashedIcon
  const actionClassName =
    "group/action h-9 max-w-full justify-between rounded-[1.45rem] border-border/60 bg-background px-3 text-xs shadow-xs hover:bg-accent"
  const actionContent = (
    <>
      <span className="truncate">{actionLabel}</span>
      <ArrowUpRightIcon
        className="size-3.5 shrink-0 opacity-70 transition-transform group-hover/action:translate-x-0.5 motion-reduce:transform-none"
        aria-hidden="true"
      />
    </>
  )

  return (
    <WorkspaceNodeFrameRoot
      data-workspace-activity-card
      className="bg-background border-border/60 h-full rounded-[2rem] px-2 py-2.5 shadow-sm"
    >
      <WorkspaceNodeFrameSurface className="flex h-full flex-col gap-3 overflow-visible">
        <WorkspaceNodeFrameHeader className="min-h-8 items-center gap-2 px-2">
          <span className="border-border/60 bg-background text-muted-foreground grid size-8 shrink-0 place-items-center rounded-xl border shadow-xs">
            <CircleDashedIcon className="size-4" aria-hidden="true" />
          </span>
          <h3 className="text-foreground line-clamp-2 min-w-0 flex-1 text-sm leading-5 font-semibold">
            {title}
          </h3>
        </WorkspaceNodeFrameHeader>

        <WorkspaceNodeFrameBody className="flex flex-1 flex-col gap-3 px-2">
          {description ? (
            <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
              {description}
            </p>
          ) : null}
          {metadata.length > 0 ? (
            <ul
              className="flex flex-wrap gap-1.5"
              aria-label="Activity details"
            >
              {metadata.map((item) => (
                <li
                  key={item}
                  className="bg-muted text-muted-foreground inline-flex min-h-6 max-w-full items-center rounded-full px-2 text-xs"
                >
                  <span className="truncate">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </WorkspaceNodeFrameBody>

        <WorkspaceNodeFrameFooter className="min-h-9 justify-between gap-2 px-2">
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-1.5 text-xs font-medium",
              status === "completed"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-blue-700 dark:text-blue-300"
            )}
          >
            <StatusIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{statusLabel}</span>
          </span>
          {href && actionLabel ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className={actionClassName}
            >
              {external ? (
                <a href={href} target="_blank" rel="noreferrer">
                  {actionContent}
                </a>
              ) : (
                <Link href={href}>{actionContent}</Link>
              )}
            </Button>
          ) : null}
        </WorkspaceNodeFrameFooter>
      </WorkspaceNodeFrameSurface>
    </WorkspaceNodeFrameRoot>
  )
}
