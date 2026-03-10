"use client"

import type { ComponentType } from "react"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import MailIcon from "lucide-react/dist/esm/icons/mail"
import NewspaperIcon from "lucide-react/dist/esm/icons/newspaper"
import PlayIcon from "lucide-react/dist/esm/icons/play"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import type {
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationMediaMode,
} from "./workspace-board-types"

export const CHANNEL_OPTIONS: Array<{
  id: WorkspaceCommunicationChannel
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}> = [
  { id: "social", label: "Social", icon: SparklesIcon },
  { id: "email", label: "Email", icon: MailIcon },
  { id: "blog", label: "Blog", icon: NewspaperIcon },
]

export const MEDIA_OPTIONS: Array<{
  id: WorkspaceCommunicationMediaMode
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}> = [
  { id: "text", label: "Text", icon: SparklesIcon },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: PlayIcon },
]

export function resolveActivityIcon(channel: WorkspaceCommunicationChannel) {
  if (channel === "email") return MailIcon
  if (channel === "blog") return NewspaperIcon
  return SparklesIcon
}

export function formatCommunicationDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not scheduled"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)
}

export function titleCaseLabel(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}
