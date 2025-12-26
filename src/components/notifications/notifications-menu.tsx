"use client"

import { useMemo, useState } from "react"
import Bell from "lucide-react/dist/esm/icons/bell"
import MessageCircle from "lucide-react/dist/esm/icons/message-circle"
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  tone?: "warning" | "info" | "success"
  unread?: boolean
}

const INBOX_ITEMS: NotificationItem[] = [
  {
    id: "roadmap-draft",
    title: "Strategic roadmap draft needs a pass",
    description: "Finish the Timeline section to unlock sharing.",
    time: "Just now",
    tone: "warning",
    unread: true,
  },
  {
    id: "checkpoint",
    title: "Checkpoint ready",
    description: "Schedule a check-in with Joel or Paula.",
    time: "Today",
    tone: "info",
    unread: true,
  },
  {
    id: "program",
    title: "Program checklist",
    description: "Add dates to the Youth Leadership Fellowship.",
    time: "Yesterday",
    tone: "info",
  },
]

const COMMENTS_ITEMS: NotificationItem[] = [
  {
    id: "comment-1",
    title: "Mentor feedback",
    description: "New comment on your Funding section draft.",
    time: "2d ago",
    tone: "success",
  },
]

const ARCHIVE_ITEMS: NotificationItem[] = []

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)

  const unreadCount = useMemo(
    () => INBOX_ITEMS.filter((item) => item.unread).length,
    [],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" aria-hidden />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="rounded-full">
              {unreadCount} new
            </Badge>
          ) : null}
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="w-full justify-start gap-2 rounded-none border-b border-border/60 bg-transparent px-2 py-1">
            <TabsTrigger value="inbox" className="gap-2">
              Inbox
              <Badge variant="secondary" className="rounded-full">
                {INBOX_ITEMS.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              Archive
              <Badge variant="secondary" className="rounded-full">
                {ARCHIVE_ITEMS.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              Comments
              <Badge variant="secondary" className="rounded-full">
                {COMMENTS_ITEMS.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="p-0">
            <NotificationsList items={INBOX_ITEMS} />
          </TabsContent>
          <TabsContent value="archive" className="p-0">
            <NotificationsList items={ARCHIVE_ITEMS} emptyLabel="Archive is empty" />
          </TabsContent>
          <TabsContent value="comments" className="p-0">
            <NotificationsList items={COMMENTS_ITEMS} emptyLabel="No new comments" />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border/60 px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center text-xs"
            onClick={() => toast.info("Archive all is coming soon.")}
          >
            Archive all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationsList({ items, emptyLabel = "Inbox is empty" }: { items: NotificationItem[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ScrollArea className="h-[360px]">
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <div key={item.id} className="group flex items-start gap-3 px-4 py-3 transition hover:bg-accent/40">
            <span className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs", toneStyles(item.tone))}>
              {item.tone === "warning" ? <AlertTriangle className="h-4 w-4" /> : null}
              {item.tone === "info" ? <Sparkles className="h-4 w-4" /> : null}
              {item.tone === "success" ? <MessageCircle className="h-4 w-4" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.unread ? <span className="h-2 w-2 rounded-full bg-primary" aria-hidden /> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function toneStyles(tone?: NotificationItem["tone"]) {
  switch (tone) {
    case "warning":
      return "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
    case "success":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    default:
      return "border-sky-500/40 bg-sky-500/15 text-sky-600 dark:text-sky-400"
  }
}
