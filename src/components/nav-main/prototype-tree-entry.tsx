"use client"

import Link from "next/link"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"

import {
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function PrototypeTreeEntry({
  href,
  isActive,
  label,
  onPrefetch,
}: {
  href: string
  isActive: boolean
  label: string
  onPrefetch?: (href: string | null | undefined) => void
}) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link
          href={href}
          prefetch={true}
          scroll={false}
          onFocus={() => onPrefetch?.(href)}
          onPointerEnter={() => onPrefetch?.(href)}
        >
          <FileTextIcon className="size-3.5 shrink-0" aria-hidden />
          <span>{label}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
